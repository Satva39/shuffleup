import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getMyStats } from "../controllers/statsController.js";

const router = Router();
router.get("/me", authMiddleware, getMyStats);
export default router;
