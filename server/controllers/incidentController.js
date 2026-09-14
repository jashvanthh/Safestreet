/**
 * controllers/incidentController.js
 *
 * Handles all incident-related HTTP requests.
 * Follows the same pattern as authController:
 *   validate → call model/service → build response → return
 *
 * ANONYMOUS STRIPPING (viva point):
 *   When isAnonymous === true, we remove reportedBy from the response object
 *   on the SERVER — not just hide it in the UI.
 *   A separate helper stripAnonymous() does this consistently everywhere.
 *   Admins in Phase 7 may still see reporterContact (documented decision).
 *
 * PAGINATION (viva point):
 *   GET /api/incidents uses page + limit query params.
 *   MongoDB .skip((page-1)*limit).limit(limit) is used.
 *   Without pagination, the entire collection would be returned as the app grows.
 *
 * COORDINATE HANDLING (critical — easy to get wrong):
 *   Client sends: { location: { lat: 12.9, lng: 77.6 } }  (Leaflet order)
 *   We store:     { location: { type:'Point', coordinates: [77.6, 12.9] } }  (GeoJSON: [lng, lat])
 *   We respond:   include coordinates as-is from DB — client must handle conversion
 */

const Incident              = require('../models/Incident');
const Notification          = require('../models/Notification');
const { findIncidentsNear } = require('../services/geoService');
const { deleteFile }        = require('../services/gridfsService');
const { notifyNearbyUsers, getIO } = require('../services/notificationService');
const {
  sendReportConfirmationEmail,
  sendStatusUpdateEmail,
  sendAdminNewIncidentAlert,
} = require('../services/emailService');
const { isValidCoordinates, isValidCategory } = require('../utils/validators');

// ── Helper: strip reportedBy from response when isAnonymous ──────────────────
const stripAnonymous = (incident) => {
  const obj = incident.toObject ? incident.toObject() : { ...incident };
  if (obj.isAnonymous) {
    delete obj.reportedBy;
    delete obj.reporterContact;   // Also strip contact — public users don't need it
  }
  return obj;
};

// ── POST /api/incidents ───────────────────────────────────────────────────────
const createIncident = async (req, res, next) => {
  try {
    const { title, description, category, lat, lng, isAnonymous, reporterContact } = req.body;

    // ── Validate required fields ──────────────────────────────────────────
    if (!title || !title.trim()) {
      const err = new Error('Title is required'); err.statusCode = 400; return next(err);
    }
    if (!description || !description.trim()) {
      const err = new Error('Description is required'); err.statusCode = 400; return next(err);
    }
    if (!isValidCategory(category)) {
      const err = new Error('Invalid category'); err.statusCode = 400; return next(err);
    }

    // ── Validate coordinates ──────────────────────────────────────────────
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum) || !isValidCoordinates([lngNum, latNum])) {
      const err = new Error('Valid latitude and longitude are required'); err.statusCode = 400; return next(err);
    }

    // ── Build incident ────────────────────────────────────────────────────
    const incidentData = {
      title:       title.trim(),
      description: description.trim(),
      category,
      location: {
        type:        'Point',
        coordinates: [lngNum, latNum],   // Store as GeoJSON [lng, lat]
      },
      reportedBy:      req.user._id,
      isAnonymous:     isAnonymous === true || isAnonymous === 'true',
      reporterContact: reporterContact || '',
    };

    // ── Attach photo if uploaded (Multer + GridFS wired in routes/incidents.js) ──
    // req.file is set by upload.single('photo') middleware when a file is present.
    // req.file.id is the GridFS ObjectId — we store only this reference, not the bytes.
    if (req.file && req.file.id) {
      incidentData.photoFileId = req.file.id;
    }

    const incident = await Incident.create(incidentData);

    // Trigger proximity notifications — async, non-blocking.
    // We do NOT await this: a notification failure must NEVER fail the report.
    // Fire-and-forget with its own error handling inside notifyNearbyUsers().
    notifyNearbyUsers(incident).catch((err) =>
      console.error('Notification error (non-fatal):', err.message)
    );

    // Trigger report confirmation email to the user who reported it
    if (req.user && req.user.email) {
      sendReportConfirmationEmail(req.user, incident).catch((err) =>
        console.error('Email confirmation error (non-fatal):', err.message)
      );
    }

    // Trigger admin alert email to notify the admin of new hazard submissions
    sendAdminNewIncidentAlert(incident, req.user).catch((err) =>
      console.error('Admin incident alert email error (non-fatal):', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      data:    { incident: stripAnonymous(incident) },
    });

  } catch (err) {
    next(err);
  }
};

// ── GET /api/incidents ────────────────────────────────────────────────────────
// Query params: category, status, from, to (ISO dates), page, limit, bounds
const getIncidents = async (req, res, next) => {
  try {
    const {
      category, status,
      from, to,
      page  = 1,
      limit = 50,
      bounds,         // format: swLat,swLng,neLat,neLng
    } = req.query;

    // ── Build filter object ───────────────────────────────────────────────
    const filter = {};

    if (category && isValidCategory(category)) {
      filter.category = category;
    }
    if (status && ['reported', 'under_review', 'resolved'].includes(status)) {
      filter.status = status;
    }
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }

    // ── Bounding box filter (map viewport) ───────────────────────────────
    // bounds=swLat,swLng,neLat,neLng  (south-west to north-east corner)
    // This filters server-side so we don't ship every incident to the client
    if (bounds) {
      const [swLat, swLng, neLat, neLng] = bounds.split(',').map(Number);
      if ([swLat, swLng, neLat, neLng].every((n) => !isNaN(n))) {
        filter.location = {
          $geoWithin: {
            $box: [
              [swLng, swLat],   // bottom-left [lng, lat]
              [neLng, neLat],   // top-right   [lng, lat]
            ],
          },
        };
      }
    }

    // ── Pagination ────────────────────────────────────────────────────────
    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip     = (pageNum - 1) * limitNum;

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .populate('reportedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Incident.countDocuments(filter),
    ]);

    // Strip anonymous reporter info from every incident
    const safeIncidents = incidents.map(stripAnonymous);

    res.status(200).json({
      success: true,
      message: 'Incidents fetched',
      data: {
        incidents: safeIncidents,
        pagination: {
          total,
          page:       pageNum,
          limit:      limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });

  } catch (err) {
    next(err);
  }
};

// ── GET /api/incidents/nearby?lat=&lng=&radius= ───────────────────────────────
const getNearbyIncidents = async (req, res, next) => {
  try {
    const { lat, lng, radius = 2 } = req.query;   // radius in km, default 2

    const latNum    = parseFloat(lat);
    const lngNum    = parseFloat(lng);
    const radiusNum = parseFloat(radius);

    if (isNaN(latNum) || isNaN(lngNum) || !isValidCoordinates([lngNum, latNum])) {
      const err = new Error('Valid lat and lng query params are required'); err.statusCode = 400; return next(err);
    }

    const incidents = await findIncidentsNear(lngNum, latNum, radiusNum);
    const safe      = incidents.map(stripAnonymous);

    res.status(200).json({
      success: true,
      message: `Found ${safe.length} incident(s) within ${radiusNum}km`,
      data:    { incidents: safe },
    });

  } catch (err) {
    next(err);
  }
};

// ── GET /api/incidents/heatmap?category=&from=&to= ───────────────────────────
// Returns lightweight [lat, lng, weight] tuples for leaflet.heat
const getHeatmapData = async (req, res, next) => {
  try {
    const { category, from, to } = req.query;

    const filter = {};
    if (category && isValidCategory(category)) filter.category = category;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }

    // Only fetch the fields we need — coordinates + nothing else
    // This keeps the response lightweight (no titles, descriptions etc.)
    const incidents = await Incident.find(filter).select('location category');

    // leaflet.heat expects: [[lat, lng, intensity], ...]
    // intensity is 1.0 for all incidents (could be weighted by recency later)
    const heatmapPoints = incidents.map((inc) => {
      const [lngVal, latVal] = inc.location.coordinates;   // [lng, lat] stored → swap for leaflet
      return [latVal, lngVal, 1.0];
    });

    res.status(200).json({
      success: true,
      message: 'Heatmap data fetched',
      data:    { points: heatmapPoints },
    });

  } catch (err) {
    next(err);
  }
};

// ── GET /api/incidents/:id ────────────────────────────────────────────────────
const getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name');

    if (!incident) {
      const err = new Error('Incident not found'); err.statusCode = 404; return next(err);
    }

    res.status(200).json({
      success: true,
      message: 'Incident fetched',
      data:    { incident: stripAnonymous(incident) },
    });

  } catch (err) {
    // CastError = invalid ObjectId format
    if (err.name === 'CastError') {
      err.message   = 'Invalid incident ID format';
      err.statusCode = 400;
    }
    next(err);
  }
};

// ── PATCH /api/incidents/:id/status  (admin only — enforced in route) ─────────
const updateIncidentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['reported', 'under_review', 'resolved'];

    if (!validStatuses.includes(status)) {
      const err = new Error(`Status must be one of: ${validStatuses.join(', ')}`);
      err.statusCode = 400; return next(err);
    }

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }   // new:true returns the updated doc
    ).populate('reportedBy', 'name email');

    if (!incident) {
      const err = new Error('Incident not found'); err.statusCode = 404; return next(err);
    }

    // Notify the original reporter via email & in-app notification
    if (incident.reportedBy && incident.reportedBy.email) {
      // 1. Email notification
      sendStatusUpdateEmail(incident.reportedBy, incident, status).catch((err) =>
        console.error('Status update email error (non-fatal):', err.message)
      );

      // 2. In-app notification & Socket.IO real-time alert
      try {
        const notif = await Notification.create({
          recipient: incident.reportedBy._id,
          incident:  incident._id,
          message:   `Status updated to "${status.replace('_', ' ')}" on your report: "${incident.title}"`,
        });

        const io = getIO ? getIO() : null;
        if (io) {
          io.to(incident.reportedBy._id.toString()).emit('notification:new', {
            _id:       notif._id,
            message:   notif.message,
            isRead:    false,
            incident: {
              _id:      incident._id,
              title:    incident.title,
              category: incident.category,
              status:   incident.status,
            },
            createdAt: notif.createdAt,
          });
        }
      } catch (err) {
        console.error('In-app notification error on status update:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Status updated to "${status}"`,
      data:    { incident: stripAnonymous(incident) },
    });

  } catch (err) {
    if (err.name === 'CastError') { err.message = 'Invalid incident ID'; err.statusCode = 400; }
    next(err);
  }
};

// ── DELETE /api/incidents/:id  (admin only — enforced in route) ───────────────
const deleteIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);

    if (!incident) {
      const err = new Error('Incident not found'); err.statusCode = 404; return next(err);
    }

    // Clean up GridFS photo if one exists
    if (incident.photoFileId) {
      try { await deleteFile(incident.photoFileId); } catch (_) { /* non-fatal */ }
    }

    res.status(200).json({
      success: true,
      message: 'Incident deleted',
      data:    null,
    });

  } catch (err) {
    if (err.name === 'CastError') { err.message = 'Invalid incident ID'; err.statusCode = 400; }
    next(err);
  }
};

module.exports = {
  createIncident,
  getIncidents,
  getNearbyIncidents,
  getHeatmapData,
  getIncidentById,
  updateIncidentStatus,
  deleteIncident,
};
