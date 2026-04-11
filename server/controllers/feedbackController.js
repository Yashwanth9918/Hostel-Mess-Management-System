import Feedback from '../models/Feedback.js';
import User from '../models/User.js';

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private (Student)
export const submitFeedback = async (req, res) => {
  try {
    const {
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
    } = req.body;

    const studentId = req.user._id;
    const messId = req.user.messId;

    // Check if feedback already exists for this meal
    const existingFeedback = await Feedback.findOne({
      studentId,
      date: new Date(date),
      mealType,
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this meal',
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      studentId,
      messId,
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

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting feedback',
      error: error.message,
    });
  }
};

// @desc    Update feedback
// @route   PUT /api/feedback/:id
// @access  Private (Student - own feedback)
export const updateFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    // Check if student owns this feedback
    if (feedback.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own feedback',
      });
    }

    // Don't allow update if feedback has been reviewed
    if (feedback.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update feedback that has been reviewed',
      });
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: updatedFeedback,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating feedback',
      error: error.message,
    });
  }
};

// @desc    Get my feedback
// @route   GET /api/feedback/my-feedback
// @access  Private (Student)
export const getMyFeedback = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { studentId: req.user._id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const feedbacks = await Feedback.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments(query);

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: feedbacks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedback',
      error: error.message,
    });
  }
};

// @desc    Get consolidated feedback (for managers)
// @route   GET /api/feedback/consolidated
// @access  Private (Manager/Admin)
export const getConsolidatedFeedback = async (req, res) => {
  try {
    const { messId, month, year } = req.query;
    
    const targetMessId = messId || req.user.messId;

    // Check if manager's messId matches
    if (req.user.role === 'manager' && req.user.messId !== targetMessId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view feedback for your assigned mess',
      });
    }

    const report = await Feedback.getConsolidatedReport(
      targetMessId,
      parseInt(month),
      parseInt(year)
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching consolidated feedback',
      error: error.message,
    });
  }
};

// @desc    Get all feedbacks for mess
// @route   GET /api/feedback/mess
// @access  Private (Manager/Admin)
export const getMessFeedbacks = async (req, res) => {
  try {
    const { messId, status, mealType, startDate, endDate, minRating, maxRating } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const targetMessId = messId || req.user.messId;

    // Check if manager's messId matches
    if (req.user.role === 'manager' && req.user.messId !== targetMessId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view feedback for your assigned mess',
      });
    }

    const query = { messId: targetMessId };

    if (status) query.status = status;
    if (mealType) query.mealType = mealType;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
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

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: feedbacks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedbacks',
      error: error.message,
    });
  }
};

// @desc    Get pending feedbacks
// @route   GET /api/feedback/pending
// @access  Private (Manager/Admin)
export const getPendingFeedbacks = async (req, res) => {
  try {
    const messId = req.query.messId || req.user.messId;

    // Check if manager's messId matches
    if (req.user.role === 'manager' && req.user.messId !== messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view feedback for your assigned mess',
      });
    }

    const feedbacks = await Feedback.getPendingFeedbacks(messId);

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending feedbacks',
      error: error.message,
    });
  }
};

// @desc    Add manager response
// @route   PUT /api/feedback/:id/respond
// @access  Private (Manager/Admin)
export const addManagerResponse = async (req, res) => {
  try {
    const { response, actionTaken, status } = req.body;

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    // Check if manager's messId matches
    if (req.user.role === 'manager' && req.user.messId !== feedback.messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only respond to feedback for your assigned mess',
      });
    }

    feedback.addManagerResponse(req.user._id, response, actionTaken);
    
    if (status) {
      feedback.status = status;
    }

    await feedback.save();

    const updatedFeedback = await Feedback.findById(req.params.id)
      .populate('studentId', 'name registrationNumber')
      .populate('managerResponse.respondedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: updatedFeedback,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding response',
      error: error.message,
    });
  }
};

// @desc    Update feedback status
// @route   PUT /api/feedback/:id/status
// @access  Private (Manager/Admin)
export const updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    // Check if manager's messId matches
    if (req.user.role === 'manager' && req.user.messId !== feedback.messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update feedback for your assigned mess',
      });
    }

    feedback.status = status;
    await feedback.save();

    res.status(200).json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status',
      error: error.message,
    });
  }
};

// @desc    Upvote feedback
// @route   PUT /api/feedback/:id/upvote
// @access  Private (All authenticated users)
export const upvoteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    feedback.addUpvote(req.user._id);
    await feedback.save();

    res.status(200).json({
      success: true,
      message: 'Feedback upvoted successfully',
      data: {
        upvotes: feedback.upvotes,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while upvoting feedback',
      error: error.message,
    });
  }
};

// @desc    Remove upvote from feedback
// @route   DELETE /api/feedback/:id/upvote
// @access  Private (All authenticated users)
export const removeUpvote = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    feedback.removeUpvote(req.user._id);
    await feedback.save();

    res.status(200).json({
      success: true,
      message: 'Upvote removed successfully',
      data: {
        upvotes: feedback.upvotes,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing upvote',
      error: error.message,
    });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private (Student - own feedback, Admin - any feedback)
export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    // Students can only delete their own pending feedback
    if (req.user.role === 'student') {
      if (feedback.studentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own feedback',
        });
      }
      if (feedback.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete feedback that has been reviewed',
        });
      }
    }

    await feedback.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting feedback',
      error: error.message,
    });
  }
};

// @desc    Get feedback statistics
// @route   GET /api/feedback/statistics
// @access  Private (Manager/Admin)
export const getFeedbackStatistics = async (req, res) => {
  try {
    const { messId, month, year } = req.query;
    
    const targetMessId = messId || req.user.messId;

    // Check if manager's messId matches
    if (req.user.role === 'manager' && req.user.messId !== targetMessId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view statistics for your assigned mess',
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [avgRatings, mealWise, distribution] = await Promise.all([
      Feedback.getAverageRatings(targetMessId, startDate, endDate),
      Feedback.getMealWiseRatings(targetMessId, startDate, endDate),
      Feedback.getRatingDistribution(targetMessId, startDate, endDate),
    ]);

    res.status(200).json({
      success: true,
      data: {
        averageRatings: avgRatings,
        mealWiseRatings: mealWise,
        ratingDistribution: distribution,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message,
    });
  }
};
