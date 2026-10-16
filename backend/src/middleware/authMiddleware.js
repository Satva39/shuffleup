import jwt from "jsonwebtoken";
import pool from "../config/database.js";

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      "SELECT email_verified, auth_version FROM users WHERE id = $1",
      [decoded.id],
    );
    const account = result.rows[0];
    if (!account || account.email_verified !== true) {
      return res
        .status(403)
        .json({ message: "Verify your email before accessing this account." });
    }
    if (
      Number(decoded.authVersion ?? 0) !== Number(account.auth_version ?? 0)
    ) {
      return res
        .status(401)
        .json({ message: "Session expired. Please sign in again." });
    }
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

export default authMiddleware;
