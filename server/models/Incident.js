/**
 * models/Incident.js
 *
 * Key design decisions to know for your viva:
 *
 * 1. COORDINATE ORDER — [longitude, latitude]
 *    GeoJSON always stores [lng, lat]. Leaflet uses [lat, lng].
 *    These are OPPOSITE. The conversion must happen in the controller
 *    before saving and again before sending to the client.
 *    Comment on EVERY coordinates field so the team never reverses them.
 *
 * 2. 2DSPHERE INDEX on location
 *    Required for $near, $nearSphere, $geoWithin queries.
 *    Without it, MongoDB throws "unable to find index for $geoNear query".
 *
 * 3. photoFileId (ObjectId, nullable)
 *    Stores the GridFS file _id. null means no photo attached.
 *    In Phase 5, Multer+GridFS will populate this.
 *    We never store the actual image bytes in this document.
 *
 * 4. isAnonymous + reportedBy stripping
 *    reportedBy is stored in DB regardless.
 *    The controller strips it from the response when isAnonymous === true.
 *    This is a server-side guarantee — the frontend cannot override it.
 *
 * 5. status enum — one-way transitions enforced in the admin controller
 *    reported → under_review → resolved
 *    (only admin can change status — enforced via requireAdmin middleware)
 */

const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Title is required'],
      trim:      true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },

    description: {
      type:      String,
      required:  [true, 'Description is required'],
      trim:      true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    category: {
      type:     String,
      required: [true, 'Category is required'],
      enum: {
        values:  ['poor_lighting', 'harassment', 'unsafe_intersection', 'suspicious_activity', 'other'],
        message: '{VALUE} is not a valid category',
      },
    },

    // GeoJSON Point — coordinates MUST be [longitude, latitude]
    location: {
      type: {
        type:    String,
        enum:    ['Point'],
        default: 'Point',
      },
      coordinates: {
        type:     [Number],   // [longitude, latitude] — GeoJSON order!
        required: [true, 'Location coordinates are required'],
        validate: {
          validator: ([lng, lat]) =>
            typeof lng === 'number' && typeof lat === 'number' &&
            lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
          message: 'Coordinates must be valid [longitude, latitude] values',
        },
      },
    },

    // GridFS file _id — null until a photo is uploaded (Phase 5)
    photoFileId: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Who reported it — may be stripped from responses if isAnonymous
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },

    isAnonymous: {
      type:    Boolean,
      default: false,
    },

    // Optional contact info — always omitted from public responses
    reporterContact: {
      type:    String,
      default: '',
      trim:    true,
    },

    status: {
      type:    String,
      enum:    ['reported', 'under_review', 'resolved'],
      default: 'reported',
    },

    // Risk severity — set by the reporter to separate density from risk level
    // Defaults to 'medium' so all existing documents remain valid
    severity: {
      type:    String,
      enum:    ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,   // createdAt + updatedAt
  }
);

// ── 2dsphere index — required for all geospatial queries ─────────────────────
incidentSchema.index({ location: '2dsphere' });

// ── Compound index for common filter combos (improves query performance) ──────
incidentSchema.index({ category: 1, status: 1, severity: 1, createdAt: -1 });

const Incident = mongoose.model('Incident', incidentSchema);
module.exports = Incident;
