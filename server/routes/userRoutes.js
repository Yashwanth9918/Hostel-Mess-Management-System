import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  getAllUsers,
  updateUserRole,
  getStudentCount,
} from "../controllers/userController.js";

const router = express.Router();

// Get all users (Admin only)
router.get("/", protect, authorize("admin"), getAllUsers);

// Update user role (Admin only)
router.put("/:id/role", protect, authorize("admin"), updateUserRole);

// Get total student count (Admin + Manager)
router.get("/count", protect, authorize("admin", "manager"), getStudentCount);

export default router;
