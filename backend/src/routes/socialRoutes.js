import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getSocialOverview,
  removeFriend,
  respondFriendRequest,
  respondGameChallenge,
  sendFriendRequest,
  sendGameChallenge,
} from "../controllers/socialController.js";

const router = express.Router();
const requestWindows = new Map();
function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const key = `${req.user?.id || req.ip || "unknown"}:${req.path}`;
    const now = Date.now();
    let entry = requestWindows.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      requestWindows.set(key, entry);
    }
    entry.count += 1;
    if (requestWindows.size > 10000) {
      for (const [storedKey, storedEntry] of requestWindows) {
        if (storedEntry.resetAt <= now) requestWindows.delete(storedKey);
      }
    }
    if (entry.count > max) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      return res.status(429).json({ message: "Too many requests. Please wait and try again." });
    }
    return next();
  };
}

router.use(authMiddleware);
router.get("/overview", getSocialOverview);
router.post("/friend-requests", rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), sendFriendRequest);
router.patch("/friend-requests/:requestId", rateLimit({ windowMs: 60 * 60 * 1000, max: 40 }), respondFriendRequest);
router.delete("/friends/:friendId", rateLimit({ windowMs: 60 * 60 * 1000, max: 30 }), removeFriend);
router.post("/challenges", rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), sendGameChallenge);
router.patch("/challenges/:challengeId", rateLimit({ windowMs: 60 * 60 * 1000, max: 40 }), respondGameChallenge);

export default router;
