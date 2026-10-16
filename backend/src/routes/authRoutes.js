import express from "express";
import {
  forgotPassword,
  getCurrentUser,
  login,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Per-process abuse guard. User-scoped DB limits additionally cap email sends
// across requests for the same account. Put a shared rate limiter in front of
// multiple backend instances for globally coordinated limits.
const windows = new Map();
function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const key = `${req.ip || req.socket?.remoteAddress || "unknown"}:${req.path}`;
    const now = Date.now();
    let entry = windows.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      windows.set(key, entry);
    }
    entry.count += 1;
    if (windows.size > 10000) {
      for (const [storedKey, storedEntry] of windows) {
        if (storedEntry.resetAt <= now) windows.delete(storedKey);
      }
    }
    if (entry.count > max) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      return res.status(429).json({ message: "Too many requests. Please wait and try again." });
    }
    return next();
  };
}

router.post("/register", rateLimit({ windowMs: 15 * 60 * 1000, max: 8 }), register);
router.post("/verify-email", rateLimit({ windowMs: 15 * 60 * 1000, max: 12 }), verifyEmail);
router.post("/resend-verification", rateLimit({ windowMs: 15 * 60 * 1000, max: 4 }), resendVerification);
router.post("/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 15 }), login);
router.post("/forgot-password", rateLimit({ windowMs: 15 * 60 * 1000, max: 4 }), forgotPassword);
router.post("/reset-password", rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), resetPassword);
router.get("/me", authMiddleware, getCurrentUser);

export default router;
