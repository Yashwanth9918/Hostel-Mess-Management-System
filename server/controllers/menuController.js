import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse.js';
import * as menuService from '../services/menuService.js';

/**
 * Menu Controller
 *
 * Handles HTTP request/response only.
 * All business logic lives in menuService.
 */

// @desc    Create a new weekly menu
// @route   POST /api/menu
// @access  Private (Mess Manager only)
export const createMenu = asyncHandler(async (req, res) => {
  const menu = await menuService.createMenu(req.user, req.body);
  sendCreated(res, menu, 'Menu created successfully');
});

// @desc    Get current week menu
// @route   GET /api/menu/current/:hostelId
// @access  Public
export const getCurrentMenu = asyncHandler(async (req, res) => {
  const menu = await menuService.getCurrentMenu(req.params.hostelId);
  sendSuccess(res, menu);
});

// @desc    Get menu for specific date
// @route   GET /api/menu/date/:hostelId/:date
// @access  Public
export const getMenuByDate = asyncHandler(async (req, res) => {
  const { hostelId, date } = req.params;
  const result = await menuService.getMenuByDate(hostelId, date);
  sendSuccess(res, result);
});

// @desc    Update menu
// @route   PUT /api/menu/:id
// @access  Private (Mess Manager only)
export const updateMenu = asyncHandler(async (req, res) => {
  const menu = await menuService.updateMenu(req.user, req.params.id, req.body);
  sendSuccess(res, menu, 'Menu updated successfully');
});

// @desc    Publish menu
// @route   PUT /api/menu/:id/publish
// @access  Private (Mess Manager only)
export const publishMenu = asyncHandler(async (req, res) => {
  const menu = await menuService.publishMenu(req.user, req.params.id);
  sendSuccess(res, menu, 'Menu published successfully');
});

// @desc    Delete menu
// @route   DELETE /api/menu/:id
// @access  Private (Mess Manager only)
export const deleteMenu = asyncHandler(async (req, res) => {
  await menuService.deleteMenu(req.user, req.params.id);
  sendSuccess(res, null, 'Menu deleted successfully');
});

// @desc    Get all menus for a mess (with pagination)
// @route   GET /api/menu/mess/:hostelId
// @access  Private
export const getAllMenusForMess = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await menuService.getAllMenusForMess(req.params.hostelId, { page, limit });
  sendPaginated(res, result.menus, result.page, result.limit, result.total);
});

// @desc    Get previous week's published menu
// @route   GET /api/menu/previous/:hostelId
// @access  Public
export const getPreviousMenu = asyncHandler(async (req, res) => {
  const menu = await menuService.getPreviousMenu(req.params.hostelId);
  sendSuccess(res, menu);
});
