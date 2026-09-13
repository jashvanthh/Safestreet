/**
 * services/geoService.js
 *
 * Geospatial helper functions used by the incident controller and the
 * notification service (Phase 8).
 *
 * WHY a separate service file?
 *   The geospatial query logic is reused in two places:
 *     1. GET /api/incidents/nearby  (incident controller)
 *     2. Notification fan-out after a new incident is created (Phase 8)
 *   Putting it here avoids duplicating the $nearSphere query in two controllers.
 *
 * MongoDB geospatial operators used here:
 *
 *   $nearSphere   — returns documents sorted by distance from a point.
 *                   Requires a 2dsphere index. Distance in metres.
 *                   Used for: "incidents near me", "users near an incident".
 *
 *   $geoWithin + $box — returns documents within a bounding box.
 *                   Used for: filtering incidents to the visible map viewport.
 *                   NOT sorted by distance.
 *
 * IMPORTANT: MongoDB $nearSphere takes [longitude, latitude] (GeoJSON order).
 *   maxDistance is in METRES, not kilometres. Always multiply km * 1000.
 */

const User     = require('../models/User');
const Incident = require('../models/Incident');

/**
 * Find incidents within a radius of a point.
 * Used by GET /api/incidents/nearby
 *
 * @param {number} lng        - longitude of the centre point
 * @param {number} lat        - latitude of the centre point
 * @param {number} radiusKm   - search radius in kilometres
 * @param {object} extraFilter - additional Mongoose filter conditions (optional)
 * @returns {Promise<Incident[]>}
 */
const findIncidentsNear = async (lng, lat, radiusKm, extraFilter = {}) => {
  return Incident.find({
    location: {
      $nearSphere: {
        $geometry: {
          type:        'Point',
          coordinates: [lng, lat],   // GeoJSON: [longitude, latitude]
        },
        $maxDistance: radiusKm * 1000,   // Convert km → metres
      },
    },
    ...extraFilter,
  }).populate('reportedBy', 'name');   // Populate name only — never passwordHash
};

/**
 * Find users whose notificationLocation is within a given radius of a point.
 * Used by notificationService (Phase 8) to fan out alerts after a new incident.
 *
 * NOTE: Each user has their OWN notificationRadius preference.
 * This query finds users where the incident is within THEIR radius.
 * We do this with $geoWithin + $centerSphere rather than $nearSphere
 * because we need "is this point within X km of each user's location",
 * not "what's the closest user".
 *
 * Actually for simplicity: we query users within a broad radius,
 * then in Phase 8 we can further filter by individual user radius if needed.
 * The Phase 8 spec says use $nearSphere against User.notificationLocation.
 *
 * @param {number} lng        - longitude of the incident
 * @param {number} lat        - latitude of the incident
 * @param {number} radiusKm   - max radius to search in km
 * @returns {Promise<User[]>}
 */
const findUsersNear = async (lng, lat, radiusKm) => {
  return User.find({
    notificationLocation: {
      $nearSphere: {
        $geometry: {
          type:        'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: radiusKm * 1000,
      },
    },
  }).select('_id name email notificationRadius');
};

module.exports = { findIncidentsNear, findUsersNear };
