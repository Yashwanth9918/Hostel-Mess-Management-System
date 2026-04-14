import Feedback from '../models/Feedback.js';
import AppError from '../utils/AppError.js';

/**
 * Feedback Service
 *
 * Contains all business logic for feedback operations.
 */

/**
 * Submit new feedback.
 */
export const submitFeedback = async (user, feedbackData) => {
  const { date, mealType, overallRating, categoryRatings, comments, suggestions, menuItems, images, isAnonymous, tags } = feedbackData;

  // Check for duplicate feedback
  const existingFeedback = await Feedback.findOne({
    studentId: user._id,
    date: new Date(date),
    mealType,
  });

  if (existingFeedback) {
    throw new AppError('Feedback already submitted for this meal', 400);
  }

  const feedback = await Feedback.create({
    studentId: user._id,
    hostelId: user.hostelId,
    date,
    mealType,
    overallRating,
    categoryRatings,
    comments,
    suggestions,
    menuItems,
    images,
    isAnonymous,
    tags,
  });

  return feedback;
};

/**
 * Update feedback (student, own pending only).
 */
export const updateFeedback = async (user, feedbackId, updateData) => {
  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) {
    throw new AppError('Feedback not found', 404);
  }

  if (feedback.studentId.toString() !== user._id.toString()) {
    throw new AppError('You can only update your own feedback', 403);
  }

  if (feedback.status !== 'pending') {
    throw new AppError('Cannot update feedback that has been reviewed', 400);
  }

  const updatedFeedback = await Feedback.findByIdAndUpdate(feedbackId, updateData, {
    new: true,
    runValidators: true,
  });

  return updatedFeedback;
};

/**
 * Get my feedback (student, paginated).
 */
export const getMyFeedback = async (userId, { startDate, endDate, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const query = { studentId: userId };

  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const feedbacks = await Feedback.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Feedback.countDocuments(query);

  return { feedbacks, total, page, limit };
};

/**
 * Get consolidated feedback report.
 */
export const getConsolidatedFeedback = async (user, { hostelId, month, year }) => {
  const targethostelId = hostelId || user.hostelId;

  if (user.role === 'manager' && user.hostelId !== targethostelId) {
    throw new AppError('You can only view feedback for your assigned hostel', 403);
  }

  return await Feedback.getConsolidatedReport(targethostelId, parseInt(month), parseInt(year));
};

/**
 * Get all feedbacks for a hostel (paginated, filtered).
 */
export const getMessFeedbacks = async (user, filters) => {
  const { hostelId, status, mealType, startDate, endDate, minRating, maxRating, page = 1, limit = 20 } = filters;
  const targethostelId = hostelId || user.hostelId;
  const skip = (page - 1) * limit;

  if (user.role === 'manager' && user.hostelId !== targethostelId) {
    throw new AppError('You can only view feedback for your assigned hostel', 403);
  }

  const query = { hostelId: targethostelId };

  if (status) query.status = status;
  if (mealType) query.mealType = mealType;
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (minRating || maxRating) {
    query.overallRating = {};
    if (minRating) query.overallRating.$gte = parseInt(minRating);
    if (maxRating) query.overallRating.$lte = parseInt(maxRating);
  }

  const feedbacks = await Feedback.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('studentId', 'name registrationNumber hostelId');

  const total = await Feedback.countDocuments(query);

  return { feedbacks, total, page, limit };
};

/**
 * Get pending feedbacks for a hostel.
 */
export const getPendingFeedbacks = async (user, queryhostelId) => {
  const hostelId = queryhostelId || user.hostelId;

  if (user.role === 'manager' && user.hostelId !== hostelId) {
    throw new AppError('You can only view feedback for your assigned hostel', 403);
  }

  return await Feedback.getPendingFeedbacks(hostelId);
};

/**
 * Add manager response to feedback.
 */
export const addManagerResponse = async (user, feedbackId, { response, actionTaken, status }) => {
  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) {
    throw new AppError('Feedback not found', 404);
  }

  if (user.role === 'manager' && user.hostelId !== feedback.hostelId) {
    throw new AppError('You can only respond to feedback for your assigned hostel', 403);
  }

  feedback.addManagerResponse(user._id, response, actionTaken);

  if (status) {
    feedback.status = status;
  }

  await feedback.save();

  return await Feedback.findById(feedbackId)
    .populate('studentId', 'name registrationNumber')
    .populate('managerResponse.respondedBy', 'name email');
};

/**
 * Update feedback status.
 */
export const updateFeedbackStatus = async (user, feedbackId, status) => {
  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) {
    throw new AppError('Feedback not found', 404);
  }

  if (user.role === 'manager' && user.hostelId !== feedback.hostelId) {
    throw new AppError('You can only update feedback for your assigned hostel', 403);
  }

  feedback.status = status;
  await feedback.save();

  return feedback;
};

/**
 * Upvote feedback.
 */
export const upvoteFeedback = async (userId, feedbackId) => {
  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) {
    throw new AppError('Feedback not found', 404);
  }

  feedback.addUpvote(userId);
  await feedback.save();

  return { upvotes: feedback.upvotes };
};

/**
 * Remove upvote from feedback.
 */
export const removeUpvote = async (userId, feedbackId) => {
  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) {
    throw new AppError('Feedback not found', 404);
  }

  feedback.removeUpvote(userId);
  await feedback.save();

  return { upvotes: feedback.upvotes };
};

/**
 * Delete feedback.
 */
export const deleteFeedback = async (user, feedbackId) => {
  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) {
    throw new AppError('Feedback not found', 404);
  }

  // Students can only delete their own pending feedback
  if (user.role === 'student') {
    if (feedback.studentId.toString() !== user._id.toString()) {
      throw new AppError('You can only delete your own feedback', 403);
    }
    if (feedback.status !== 'pending') {
      throw new AppError('Cannot delete feedback that has been reviewed', 400);
    }
  }

  await feedback.deleteOne();
};

/**
 * Get feedback statistics.
 */
export const getFeedbackStatistics = async (user, { hostelId, month, year }) => {
  const targethostelId = hostelId || user.hostelId;

  if (user.role === 'manager' && user.hostelId !== targethostelId) {
    throw new AppError('You can only view statistics for your assigned hostel', 403);
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [avgRatings, mealWise, distribution] = await Promise.all([
    Feedback.getAverageRatings(targethostelId, startDate, endDate),
    Feedback.getMealWiseRatings(targethostelId, startDate, endDate),
    Feedback.getRatingDistribution(targethostelId, startDate, endDate),
  ]);

  return {
    averageRatings: avgRatings,
    mealWiseRatings: mealWise,
    ratingDistribution: distribution,
  };
};
