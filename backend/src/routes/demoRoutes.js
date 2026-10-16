import { Router } from "express";
import { createDemoSession } from "../controllers/demoController.js";

const router = Router();
router.post("/session", createDemoSession);
export default router;
