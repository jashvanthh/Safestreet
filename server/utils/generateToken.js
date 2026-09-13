/**
 * utils/generateToken.js
 *
 * Creates a signed JWT containing { id, role }.
 * The token is returned to the client on login and stored in localStorage
 * (or httpOnly cookie — document your choice).
 *
 * Why include role in the token?
 *   Speed: the client can conditionally render admin UI without an extra API call.
 *   Safety: we STILL re-verify role from DB in requireAdmin middleware —
 *            the frontend role is for UX only, never trusted for authorization.
 *
 * Built in Phase 2.
 */

const jwt = require('jsonwebtoken');

/**
 * @param {string} id   - MongoDB User _id
 * @param {string} role - 'resident' | 'admin'
 * @returns {string} signed JWT
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
