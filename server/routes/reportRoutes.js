import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { getSystemReport } from "../controllers/reportController.js";

const router = express.Router();

// Only admin can view full system analytics
router.get("/system", protect, authorize("admin"), getSystemReport);

export default router;
