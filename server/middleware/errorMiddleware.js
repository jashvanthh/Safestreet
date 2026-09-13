/**
 * middleware/errorMiddleware.js — Centralized error handler
 *
 * Express recognizes a 4-argument middleware function as an error handler.
 * It is registered LAST in app.js.
 *
 * Why centralize errors?
 *   • Consistent response shape: { success: false, message }
 *   • No raw stack traces returned to clients in production
 *   • Any controller can call next(error) to reach here
 *
 * Usage in a controller:
 *   const error = new Error('Not found');
 *   error.statusCode = 404;
 *   return next(error);
 *
 *   OR use a helper that does this for you (see utils/AppError.js if added later)
 */

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only include stack trace in development — never expose it in production
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
