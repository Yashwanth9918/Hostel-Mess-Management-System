import Menu from '../models/Menu.js';
import User from '../models/User.js';

// @desc    Create a new weekly menu
// @route   POST /api/menu
// @access  Private (Mess Manager only)
export const createMenu = async (req, res) => {
  try {
    const { messId, weekStartDate, weekEndDate, weekNumber, year, dailyMenus, announcement } = req.body;

    // Check if manager's messId matches the menu's messId
    if (req.user.role === 'manager' && req.user.messId !== messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create menus for your assigned mess',
      });
    }

    // Check if menu already exists for this week
    const existingMenu = await Menu.findOne({
      messId,
      weekStartDate: new Date(weekStartDate),
      isActive: true,
    });

    if (existingMenu) {
      return res.status(400).json({
        success: false,
        message: 'Menu already exists for this week. Please update the existing menu.',
      });
    }

    // Create menu
    const menu = await Menu.create({
      messId,
      weekStartDate,
      weekEndDate,
      weekNumber,
      year,
      dailyMenus,
      announcement,
      createdBy: req.user._id,
    });

    const populatedMenu = await Menu.findById(menu._id).populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Menu created successfully',
      data: populatedMenu,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating menu',
      error: error.message,
    });
  }
};

// @desc    Get current week menu
// @route   GET /api/menu/current/:messId
// @access  Public
export const getCurrentMenu = async (req, res) => {
  try {
    const { messId } = req.params;

    const menu = await Menu.getCurrentWeekMenu(messId);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'No menu found for current week',
      });
    }

    res.status(200).json({
      success: true,
      data: menu,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching menu',
      error: error.message,
    });
  }
};

// @desc    Get menu for specific date
// @route   GET /api/menu/date/:messId/:date
// @access  Public
export const getMenuByDate = async (req, res) => {
  try {
    const { messId, date } = req.params;

    const targetDate = new Date(date);
    const menu = await Menu.findOne({
      messId,
      weekStartDate: { $lte: targetDate },
      weekEndDate: { $gte: targetDate },
      status: 'published',
      isActive: true,
    }).populate('createdBy', 'name email');

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'No menu found for the specified date',
      });
    }

    const dayMenu = menu.getMenuForDate(date);

    res.status(200).json({
      success: true,
      data: {
        menu,
        dayMenu,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching menu',
      error: error.message,
    });
  }
};

// @desc    Update menu
// @route   PUT /api/menu/:id
// @access  Private (Mess Manager only)
export const updateMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found',
      });
    }

    // Check if manager's messId matches the menu's messId
    if (req.user.role === 'manager' && req.user.messId !== menu.messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update menus for your assigned mess',
      });
    }

    // Update menu
    const updatedMenu = await Menu.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Menu updated successfully',
      data: updatedMenu,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating menu',
      error: error.message,
    });
  }
};

// @desc    Publish menu
// @route   PUT /api/menu/:id/publish
// @access  Private (Mess Manager only)
export const publishMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found',
      });
    }

    // Check authorization
    if (req.user.role === 'manager' && req.user.messId !== menu.messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only publish menus for your assigned mess',
      });
    }

    menu.status = 'published';
    await menu.save();

    res.status(200).json({
      success: true,
      message: 'Menu published successfully',
      data: menu,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while publishing menu',
      error: error.message,
    });
  }
};

// @desc    Delete menu
// @route   DELETE /api/menu/:id
// @access  Private (Mess Manager only)
export const deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found',
      });
    }

    // Check authorization
    if (req.user.role === 'manager' && req.user.messId !== menu.messId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete menus for your assigned mess',
      });
    }

    await menu.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Menu deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting menu',
      error: error.message,
    });
  }
};

// @desc    Get all menus for a mess (with pagination)
// @route   GET /api/menu/mess/:messId
// @access  Private
export const getAllMenusForMess = async (req, res) => {
  try {
    const { messId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const menus = await Menu.find({ messId, isActive: true })
      .sort({ weekStartDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email');

    const total = await Menu.countDocuments({ messId, isActive: true });

    res.status(200).json({
      success: true,
      count: menus.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: menus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching menus',
      error: error.message,
    });
  }
};

// @desc    Get previous week's published menu for a mess
// @route   GET /api/menu/previous/:messId
// @access  Public (Manager/Admin)
export const getPreviousMenu = async (req, res) => {
  try {
    const { messId } = req.params;

    const today = new Date();
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 7);

    // Find the most recent published menu before this week
    const previousMenu = await Menu.findOne({
      messId,
      weekEndDate: { $lte: today },
      status: 'published',
      isActive: true,
    })
      .sort({ weekEndDate: -1 })
      .populate('createdBy', 'name email');

    if (!previousMenu) {
      return res.status(404).json({
        success: false,
        message: 'No previous menu found for this mess',
      });
    }

    res.status(200).json({
      success: true,
      data: previousMenu,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching previous menu',
      error: error.message,
    });
  }
};
