/**
 * middleware/authMiddleware.js
 *
 * How JWT auth works (explain this in your viva):
 *
 * 1. Client sends:  Authorization: Bearer <jwt_token>
 * 2. We extract the token from the header
 * 3. jwt.verify() checks the signature (was it signed by OUR secret?) + expiry
 * 4. If valid, the payload { id, role } is decoded
 * 5. We re-fetch the user from DB using that id
 *
 * WHY re-fetch from DB? (critical point)
 *   The token payload is unencrypted — anyone can decode it with base64.
 *   We trust the SIGNATURE (which only we can create), but we do NOT trust
 *   the role/data inside. A user could be deleted or have their role changed
 *   after the token was issued. Re-fetching from DB catches this.
 *   Never do: if (req.headers['x-role'] === 'admin') — the client controls that.
 *
 * 6. Attach user to req.user so downstream controllers can use it
 * 7. Call next() to pass control to the route handler
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  try {
    // ── Step 1: Extract token ──────────────────────────────────────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('No token provided. Please log in.');
      error.statusCode = 401;
      return next(error);
    }

    const token = authHeader.split(' ')[1];  // "Bearer <token>" → "<token>"

    // ── Step 2: Verify signature and expiry ───────────────────────────────
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      const error = new Error(
        jwtError.name === 'TokenExpiredError'
          ? 'Session expired. Please log in again.'
          : 'Invalid token. Please log in.'
      );
      error.statusCode = 401;
      return next(error);
    }

    // ── Step 3: Re-fetch user from DB (never trust payload alone) ─────────
    // .select('+passwordHash') is NOT used here — we don't need the hash
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      const error = new Error('User no longer exists.');
      error.statusCode = 401;
      return next(error);
    }

    // ── Step 4: Attach to request and continue ────────────────────────────
    req.user = user;   // Now any controller can access req.user.role, req.user._id etc.
    next();

  } catch (err) {
    next(err);
  }
};

module.exports = { requireAuth };
