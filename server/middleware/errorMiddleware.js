import AppError from '../utils/AppError.js';

/**
 * Global error-handling middleware.
 *
 * Mount this LAST (after all routes) in app.js.
 * Any error thrown or passed via next(err) ends up here.
 *
 * Handles:
 *  - AppError       → sends clean operational error
 *  - CastError      → invalid MongoDB ObjectId
 *  - 11000          → duplicate key (unique constraint)
 *  - ValidationError→ Mongoose schema validation failures
 *  - JWT errors     → invalid / expired tokens
 *  - Everything else→ generic 500
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message, stack: err.stack };

  // ── Mongoose bad ObjectId ──────────────────────────────────────
  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // ── Mongoose duplicate key ─────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    error = new AppError(`Duplicate value for: ${field}. Please use another value.`, 400);
  }

  // ── Mongoose validation error ──────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new AppError(`Validation failed: ${messages.join('. ')}`, 400);
  }

  // ── JWT invalid token ──────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }

  // ── JWT expired token ──────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token has expired. Please log in again.', 401);
  }

  // ── Determine status code ──────────────────────────────────────
  const statusCode = error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log full error in development; only operational messages in production
  if (!isProduction) {
    console.error('Error:', err);
  } else if (statusCode === 500) {
    // In production, log unexpected errors for debugging
    console.error('Unexpected Error:', err);
  }

  const errorMessage = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: errorMessage,
    // Include stack trace only in development
    ...((!isProduction && error.stack) && { stack: error.stack }),
  });
};

export default errorHandler;
