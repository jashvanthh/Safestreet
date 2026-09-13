/**
 * controllers/authController.js
 *
 * Three endpoints, each with a clear responsibility:
 *
 * register() — create a new resident account
 *   • Validate input server-side (never trust the client)
 *   • Check for duplicate email
 *   • Set passwordHash = plaintext password (pre-save hook will hash it)
 *   • Return JWT + user object (no passwordHash)
 *
 * login() — authenticate an existing user
 *   • Find user by email (must use .select('+passwordHash') to get the hash,
 *     since the schema has select:false on that field)
 *   • Use user.comparePassword() — bcrypt timing-safe comparison
 *   • Return JWT + user object
 *
 * getMe() — return the currently authenticated user
 *   • requireAuth middleware already did all the work
 *   • req.user is already populated — just return it
 *
 * Response shape (always):
 *   { success: true, message: '...', data: { token, user } }
 *   { success: false, message: '...' }
 */

const User          = require('../models/User');
const generateToken = require('../utils/generateToken');
const { isValidEmail, isValidPassword } = require('../utils/validators');
const { syncNotificationsForUser }      = require('../services/notificationService');

// ── POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, notificationLocation, notificationRadius } = req.body;

    // ── Input validation ──────────────────────────────────────────────────
    if (!name || !name.trim()) {
      const err = new Error('Name is required'); err.statusCode = 400; return next(err);
    }
    if (!isValidEmail(email)) {
      const err = new Error('Invalid email address'); err.statusCode = 400; return next(err);
    }
    if (!isValidPassword(password)) {
      const err = new Error('Password must be at least 6 characters'); err.statusCode = 400; return next(err);
    }

    // ── Check for duplicate email ─────────────────────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const err = new Error('An account with this email already exists'); err.statusCode = 409; return next(err);
    }

    // ── Build user object ─────────────────────────────────────────────────
    const userData = {
      name:         name.trim(),
      email:        email.toLowerCase(),
      passwordHash: password,      // Pre-save hook will bcrypt this
    };

    // Optional: set notification location if provided
    if (notificationLocation?.coordinates?.length === 2) {
      userData.notificationLocation = notificationLocation;
    }
    if (notificationRadius) {
      userData.notificationRadius = notificationRadius;
    }

    const user  = await User.create(userData);
    const token = generateToken(user._id, user.role);

    // Build safe user object (no passwordHash)
    const safeUser = {
      _id:                  user._id,
      name:                 user.name,
      email:                user.email,
      role:                 user.role,
      notificationLocation: user.notificationLocation,
      notificationRadius:   user.notificationRadius,
      createdAt:            user.createdAt,
    };

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data:    { token, user: safeUser },
    });

  } catch (err) {
    // Mongoose duplicate key error (race condition — two simultaneous registers)
    if (err.code === 11000) {
      err.message   = 'An account with this email already exists';
      err.statusCode = 409;
    }
    next(err);
  }
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error('Email and password are required'); err.statusCode = 400; return next(err);
    }

    // Must explicitly select passwordHash — schema has select:false
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user) {
      // Use a generic message — don't reveal whether email exists
      const err = new Error('Invalid email or password'); err.statusCode = 401; return next(err);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password'); err.statusCode = 401; return next(err);
    }

    const token = generateToken(user._id, user.role);

    const safeUser = {
      _id:                  user._id,
      name:                 user.name,
      email:                user.email,
      role:                 user.role,
      notificationLocation: user.notificationLocation,
      notificationRadius:   user.notificationRadius,
      createdAt:            user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data:    { token, user: safeUser },
    });

  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  // requireAuth middleware already verified the token and attached req.user
  // Nothing to do except return it
  res.status(200).json({
    success: true,
    message: 'User profile fetched',
    data:    { user: req.user },
  });
};

// ── PATCH /api/auth/profile ────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { notificationLocation, notificationRadius } = req.body;
    const updates = {};

    // Validate and accept notificationLocation
    if (notificationLocation) {
      const { type, coordinates } = notificationLocation;
      if (
        type !== 'Point' ||
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        isNaN(coordinates[0]) ||
        isNaN(coordinates[1])
      ) {
        const err = new Error('Invalid location format'); err.statusCode = 400; return next(err);
      }
      updates.notificationLocation = { type: 'Point', coordinates };
    }

    // Validate and accept notificationRadius (1–50 km)
    if (notificationRadius !== undefined) {
      const radius = parseFloat(notificationRadius);
      if (isNaN(radius) || radius < 0.5 || radius > 50) {
        const err = new Error('Radius must be between 0.5 and 50 km'); err.statusCode = 400; return next(err);
      }
      updates.notificationRadius = radius;
    }

    if (Object.keys(updates).length === 0) {
      const err = new Error('Nothing to update'); err.statusCode = 400; return next(err);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    // Sync any existing incidents within the newly updated alert radius
    syncNotificationsForUser(user).catch((err) =>
      console.error('Error syncing notifications on profile update:', err.message)
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe, updateProfile };
