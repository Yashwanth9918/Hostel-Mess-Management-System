import Menu from '../models/Menu.js';
import AppError from '../utils/AppError.js';

/**
 * Menu Service
 *
 * Contains all business logic for menu operations.
 */

/**
 * Create a new weekly menu.
 */
export const createMenu = async (user, menuData) => {
  const { hostelId, weekStartDate, weekEndDate, weekNumber, year, dailyMenus, announcement } = menuData;

  // Managers can only create menus for their own hostel
  if (user.role === 'manager' && user.hostelId !== hostelId) {
    throw new AppError('You can only create menus for your assigned hostel', 403);
  }

  // Check for existing menu for this week
  const existingMenu = await Menu.findOne({
    hostelId,
    weekStartDate: new Date(weekStartDate),
    isActive: true,
  });

  if (existingMenu) {
    throw new AppError('Menu already exists for this week. Please update the existing menu.', 400);
  }

  const menu = await Menu.create({
    hostelId,
    weekStartDate,
    weekEndDate,
    weekNumber,
    year,
    dailyMenus,
    announcement,
    createdBy: user._id,
  });

  return await Menu.findById(menu._id).populate('createdBy', 'name email');
};

/**
 * Get current week menu for a hostel.
 */
export const getCurrentMenu = async (hostelId) => {
  const menu = await Menu.getCurrentWeekMenu(hostelId);

  if (!menu) {
    throw new AppError('No menu found for current week', 404);
  }

  return menu;
};

/**
 * Get menu for a specific date.
 */
export const getMenuByDate = async (hostelId, date) => {
  const targetDate = new Date(date);

  const menu = await Menu.findOne({
    hostelId,
    weekStartDate: { $lte: targetDate },
    weekEndDate: { $gte: targetDate },
    status: 'published',
    isActive: true,
  }).populate('createdBy', 'name email');

  if (!menu) {
    throw new AppError('No menu found for the specified date', 404);
  }

  const dayMenu = menu.getMenuForDate(date);

  return { menu, dayMenu };
};

/**
 * Update a menu.
 */
export const updateMenu = async (user, menuId, updateData) => {
  const menu = await Menu.findById(menuId);

  if (!menu) {
    throw new AppError('Menu not found', 404);
  }

  if (user.role === 'manager' && user.hostelId !== menu.hostelId) {
    throw new AppError('You can only update menus for your assigned hostel', 403);
  }

  const updatedMenu = await Menu.findByIdAndUpdate(menuId, updateData, {
    new: true,
    runValidators: true,
  }).populate('createdBy', 'name email');

  return updatedMenu;
};

/**
 * Publish a menu.
 */
export const publishMenu = async (user, menuId) => {
  const menu = await Menu.findById(menuId);

  if (!menu) {
    throw new AppError('Menu not found', 404);
  }

  if (user.role === 'manager' && user.hostelId !== menu.hostelId) {
    throw new AppError('You can only publish menus for your assigned hostel', 403);
  }

  menu.status = 'published';
  await menu.save();

  return menu;
};

/**
 * Delete a menu.
 */
export const deleteMenu = async (user, menuId) => {
  const menu = await Menu.findById(menuId);

  if (!menu) {
    throw new AppError('Menu not found', 404);
  }

  if (user.role === 'manager' && user.hostelId !== menu.hostelId) {
    throw new AppError('You can only delete menus for your assigned hostel', 403);
  }

  await menu.deleteOne();
};

/**
 * Get all menus for a hostel (paginated).
 */
export const getAllMenusForMess = async (hostelId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const menus = await Menu.find({ hostelId, isActive: true })
    .sort({ weekStartDate: -1 })
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'name email');

  const total = await Menu.countDocuments({ hostelId, isActive: true });

  return { menus, total, page, limit };
};

/**
 * Get previous week's published menu.
 */
export const getPreviousMenu = async (hostelId) => {
  const today = new Date();

  const previousMenu = await Menu.findOne({
    hostelId,
    weekEndDate: { $lte: today },
    status: 'published',
    isActive: true,
  })
    .sort({ weekEndDate: -1 })
    .populate('createdBy', 'name email');

  if (!previousMenu) {
    throw new AppError('No previous menu found for this hostel', 404);
  }

  return previousMenu;
};
