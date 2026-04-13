/**
 * Custom operational error class for the application.
 *
 * Usage:
 *   throw new AppError('User not found', 404);
 *
 * The global error middleware will catch this and return a clean
 * JSON response with the correct status code.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404, 500)
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes expected errors from programming bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
