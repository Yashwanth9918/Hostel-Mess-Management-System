/**
 * Standardized API response helpers.
 *
 * Every response from the API follows one of two shapes:
 *   Success: { success: true,  message: "...", data: { ... } }
 *   Error:   { success: false, error: "..." }
 *
 * These helpers enforce that contract so controllers stay consistent.
 */

/**
 * Send a success response (HTTP 200 by default).
 */
export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a 201 Created response.
 */
export const sendCreated = (res, data, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send a paginated success response.
 */
export const sendPaginated = (res, data, page, limit, total, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    count: data.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data,
  });
};
