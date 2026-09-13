/**
 * controllers/authController.js
 *
 * Handles register, login, and getMe.
 * Each function:
 *   1. Validates input
 *   2. Calls a service or model
 *   3. Returns a response in { success, data } shape
 *   4. Passes errors to next() for centralized handling
 *
 * Built in Phase 2.
 */

// STUB — implemented in Phase 2
const register = async (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const login = async (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

const getMe = async (_req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

module.exports = { register, login, getMe };
