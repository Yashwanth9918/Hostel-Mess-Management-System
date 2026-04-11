import express from 'express';
import {
  createMenu,
  getCurrentMenu,
  getMenuByDate,
  updateMenu,
  publishMenu,
  deleteMenu,
  getAllMenusForMess,
  getPreviousMenu,
} from '../controllers/menuController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.get('/current/:messId', getCurrentMenu);
router.get('/previous/:messId', getPreviousMenu);
router.get('/date/:messId/:date', getMenuByDate);


// Protected routes - Manager only
router.post('/', protect, authorize('manager', 'admin'), createMenu);
router.put('/:id', protect, authorize('manager', 'admin'), updateMenu);
router.put('/:id/publish', protect, authorize('manager', 'admin'), publishMenu);
router.delete('/:id', protect, authorize('manager', 'admin'), deleteMenu);

// Protected routes - All authenticated users
router.get('/mess/:messId', protect, getAllMenusForMess);



export default router;
