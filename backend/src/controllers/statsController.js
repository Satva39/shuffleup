import { getPlayerGameStats } from "../utils/gameStats.js";

export async function getMyStats(req, res) {
  try {
    const result = await getPlayerGameStats(req.user.id);
    res.set("Cache-Control", "no-store");
    return res.json(result);
  } catch (error) {
    console.error("Unable to load player stats:", error?.message || "Database error");
    return res.status(503).json({ message: "Player statistics are temporarily unavailable." });
  }
}
