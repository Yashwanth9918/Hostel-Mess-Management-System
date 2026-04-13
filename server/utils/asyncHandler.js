/**
 * Wraps an async Express route handler so that any rejected promise
 * is automatically forwarded to the global error middleware via next().
 *
 * This eliminates the need for try/catch blocks in every controller.
 *
 * Usage:
 *   import asyncHandler from '../utils/asyncHandler.js';
 *
 *   export const getUsers = asyncHandler(async (req, res) => {
 *     const users = await User.find();
 *     res.json({ success: true, data: users });
 *   });
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
