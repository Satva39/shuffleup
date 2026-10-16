import pool from "../config/database.js";
import { GAME_IDS } from "../../../shared/constants/platform.js";
import { createRoom, addPlayer, deleteRoom, findActiveRoomForPlayer } from "../sockets/roomManager.js";

const ALLOWED_GAMES = new Set(Object.values(GAME_IDS));
const FRIEND_REQUEST_TTL_HOURS = 24 * 14;
const CHALLENGE_TTL_HOURS = 24;

function fail(res, status, message) {
  return res.status(status).json({ message });
}

function ioFrom(req) {
  return req.app?.get?.("io") || null;
}

function notifyUser(req, userId, event, payload) {
  const io = ioFrom(req);
  if (io && userId) io.to(`auth-user:${String(userId)}`).emit(event, payload);
}

function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().replace(/^@/, "").slice(0, 30) : "";
}

export async function getSocialOverview(req, res) {
  const userId = req.user.id;
  try {
    await pool.query("UPDATE game_challenges SET status = 'expired' WHERE status = 'pending' AND expires_at <= NOW()");
    const [friends, incomingRequests, outgoingRequests, incomingChallenges, outgoingChallenges] = await Promise.all([
      pool.query(
        `SELECT u.id, u.username, f.created_at AS since
         FROM friendships f
         JOIN users u ON u.id = CASE WHEN f.user_low = $1 THEN f.user_high ELSE f.user_low END
         WHERE f.user_low = $1 OR f.user_high = $1
         ORDER BY lower(u.username)`, [userId]),
      pool.query(
        `SELECT r.id, r.created_at, u.id AS user_id, u.username
         FROM friend_requests r JOIN users u ON u.id = r.sender_id
         WHERE r.receiver_id = $1 AND r.status = 'pending' AND r.expires_at > NOW()
         ORDER BY r.created_at DESC LIMIT 50`, [userId]),
      pool.query(
        `SELECT r.id, r.created_at, u.id AS user_id, u.username
         FROM friend_requests r JOIN users u ON u.id = r.receiver_id
         WHERE r.sender_id = $1 AND r.status = 'pending' AND r.expires_at > NOW()
         ORDER BY r.created_at DESC LIMIT 50`, [userId]),
      pool.query(
        `SELECT c.id, c.game_id, c.status, c.room_code, c.created_at, c.expires_at,
                u.id AS user_id, u.username
         FROM game_challenges c JOIN users u ON u.id = c.sender_id
         WHERE c.receiver_id = $1 AND c.status IN ('pending','accepted')
         ORDER BY c.created_at DESC LIMIT 50`, [userId]),
      pool.query(
        `SELECT c.id, c.game_id, c.status, c.room_code, c.created_at, c.expires_at,
                u.id AS user_id, u.username
         FROM game_challenges c JOIN users u ON u.id = c.receiver_id
         WHERE c.sender_id = $1 AND c.status IN ('pending','accepted')
         ORDER BY c.created_at DESC LIMIT 50`, [userId]),
    ]);
    return res.json({
      friends: friends.rows,
      incomingRequests: incomingRequests.rows,
      outgoingRequests: outgoingRequests.rows,
      incomingChallenges: incomingChallenges.rows,
      outgoingChallenges: outgoingChallenges.rows,
    });
  } catch (error) {
    console.error("Social overview failed.", error?.message || "Database error.");
    return fail(res, 500, "Unable to load friends and challenges right now.");
  }
}

export async function sendFriendRequest(req, res) {
  const username = normalizeUsername(req.body?.username);
  if (username.length < 2) return fail(res, 400, "Enter a username with at least 2 characters.");
  const senderId = req.user.id;
  try {
    const targetResult = await pool.query(
      "SELECT id, username FROM users WHERE lower(username) = lower($1) AND email_verified = TRUE LIMIT 1",
      [username],
    );
    const target = targetResult.rows[0];
    if (!target) return fail(res, 404, "No verified account was found for that username.");
    if (String(target.id) === String(senderId)) return fail(res, 400, "You cannot send a friend request to yourself.");

    const existingFriendship = await pool.query(
      "SELECT 1 FROM friendships WHERE (user_low = LEAST($1::uuid, $2::uuid) AND user_high = GREATEST($1::uuid, $2::uuid)) LIMIT 1",
      [senderId, target.id],
    );
    if (existingFriendship.rowCount) return fail(res, 409, "You are already friends with this player.");
    const pending = await pool.query(
      `SELECT 1 FROM friend_requests WHERE status = 'pending' AND expires_at > NOW()
       AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)) LIMIT 1`,
      [senderId, target.id],
    );
    if (pending.rowCount) return fail(res, 409, "A pending friend request already exists between these accounts.");

    const inserted = await pool.query(
      `INSERT INTO friend_requests (sender_id, receiver_id, status, expires_at)
       VALUES ($1, $2, 'pending', NOW() + ($3::int * INTERVAL '1 hour'))
       RETURNING id, created_at`,
      [senderId, target.id, FRIEND_REQUEST_TTL_HOURS],
    );
    const request = { id: inserted.rows[0].id, createdAt: inserted.rows[0].created_at, senderId, senderUsername: req.user.username };
    notifyUser(req, target.id, "friend-request-received", request);
    return res.status(201).json({ message: `Friend request sent to ${target.username}.`, request });
  } catch (error) {
    if (error?.code === "23505") return fail(res, 409, "A friend request already exists.");
    console.error("Friend request creation failed.", error?.message || "Database error.");
    return fail(res, 500, "Unable to send that friend request right now.");
  }
}

export async function respondFriendRequest(req, res) {
  const requestId = req.params?.requestId;
  const action = req.body?.action;
  if (!/^[0-9a-f-]{36}$/i.test(String(requestId || ""))) return fail(res, 400, "Invalid friend request.");
  if (!['accept', 'reject'].includes(action)) return fail(res, 400, "Action must be accept or reject.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const found = await client.query(
      `SELECT id, sender_id, receiver_id, status, expires_at FROM friend_requests
       WHERE id = $1 FOR UPDATE`, [requestId]);
    const request = found.rows[0];
    if (!request || String(request.receiver_id) !== String(req.user.id)) {
      await client.query("ROLLBACK");
      return fail(res, 404, "Friend request not found.");
    }
    if (request.status !== "pending" || new Date(request.expires_at).getTime() <= Date.now()) {
      await client.query("ROLLBACK");
      return fail(res, 409, "This friend request is no longer pending.");
    }
    if (action === "accept") {
      await client.query(
        `INSERT INTO friendships (user_low, user_high)
         VALUES (LEAST($1::uuid, $2::uuid), GREATEST($1::uuid, $2::uuid))
         ON CONFLICT (user_low, user_high) DO NOTHING`,
        [request.sender_id, request.receiver_id],
      );
    }
    await client.query(
      "UPDATE friend_requests SET status = $2, responded_at = NOW() WHERE id = $1",
      [requestId, action === "accept" ? "accepted" : "rejected"],
    );
    await client.query("COMMIT");
    notifyUser(req, request.sender_id, "friend-request-responded", { requestId, action, receiverId: req.user.id, receiverUsername: req.user.username });
    return res.json({ success: true, status: action === "accept" ? "accepted" : "rejected" });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { /* transaction already ended */ }
    console.error("Friend request response failed.", error?.message || "Database error.");
    return fail(res, 500, "Unable to update that friend request right now.");
  } finally {
    client.release();
  }
}

export async function removeFriend(req, res) {
  const friendId = req.params?.friendId;
  if (!/^[0-9a-f-]{36}$/i.test(String(friendId || ""))) return fail(res, 400, "Invalid friend.");
  if (String(friendId) === String(req.user.id)) return fail(res, 400, "Invalid friend.");
  try {
    const removed = await pool.query(
      `DELETE FROM friendships WHERE user_low = LEAST($1::uuid, $2::uuid) AND user_high = GREATEST($1::uuid, $2::uuid) RETURNING user_low`,
      [req.user.id, friendId],
    );
    if (!removed.rowCount) return fail(res, 404, "Friendship not found.");
    return res.json({ success: true });
  } catch (error) {
    console.error("Friend removal failed.", error?.message || "Database error.");
    return fail(res, 500, "Unable to remove that friend right now.");
  }
}

export async function sendGameChallenge(req, res) {
  const friendId = req.body?.friendId;
  const gameId = req.body?.gameId;
  if (!/^[0-9a-f-]{36}$/i.test(String(friendId || "")) || String(friendId) === String(req.user.id)) {
    return fail(res, 400, "Choose a valid friend.");
  }
  if (!ALLOWED_GAMES.has(gameId)) return fail(res, 400, "Choose a supported game.");
  try {
    const friendship = await pool.query(
      `SELECT 1 FROM friendships WHERE user_low = LEAST($1::uuid, $2::uuid) AND user_high = GREATEST($1::uuid, $2::uuid)`,
      [req.user.id, friendId],
    );
    if (!friendship.rowCount) return fail(res, 403, "You can only challenge someone on your friends list.");
    const inserted = await pool.query(
      `INSERT INTO game_challenges (sender_id, receiver_id, game_id, status, expires_at)
       VALUES ($1, $2, $3, 'pending', NOW() + ($4::int * INTERVAL '1 hour'))
       RETURNING id, game_id, created_at, expires_at`,
      [req.user.id, friendId, gameId, CHALLENGE_TTL_HOURS],
    );
    const challenge = { ...inserted.rows[0], senderId: req.user.id, senderUsername: req.user.username };
    notifyUser(req, friendId, "game-challenge-received", challenge);
    return res.status(201).json({ message: "Challenge sent.", challenge });
  } catch (error) {
    console.error("Game challenge creation failed.", error?.message || "Database error.");
    return fail(res, 500, "Unable to send that challenge right now.");
  }
}

export async function respondGameChallenge(req, res) {
  const challengeId = req.params?.challengeId;
  const action = req.body?.action;
  if (!/^[0-9a-f-]{36}$/i.test(String(challengeId || ""))) return fail(res, 400, "Invalid challenge.");
  if (!['accept', 'reject'].includes(action)) return fail(res, 400, "Action must be accept or reject.");

  const client = await pool.connect();
  let createdRoomCode = null;
  let senderId = null;
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT c.id, c.sender_id, c.receiver_id, c.game_id, c.status, c.expires_at,
              sender.username AS sender_username, receiver.username AS receiver_username
       FROM game_challenges c
       JOIN users sender ON sender.id = c.sender_id
       JOIN users receiver ON receiver.id = c.receiver_id
       WHERE c.id = $1 FOR UPDATE OF c`, [challengeId]);
    const challenge = result.rows[0];
    if (!challenge || String(challenge.receiver_id) !== String(req.user.id)) {
      await client.query("ROLLBACK");
      return fail(res, 404, "Challenge not found.");
    }
    if (challenge.status !== "pending" || new Date(challenge.expires_at).getTime() <= Date.now()) {
      if (challenge.status === "pending") {
        await client.query("UPDATE game_challenges SET status='expired' WHERE id=$1", [challengeId]);
      }
      await client.query("COMMIT");
      return fail(res, 409, "This challenge is no longer pending.");
    }

    if (action === "accept") {
      if (findActiveRoomForPlayer(challenge.sender_id) || findActiveRoomForPlayer(challenge.receiver_id)) {
        await client.query("ROLLBACK");
        return fail(res, 409, "Both players must leave their current room before accepting a challenge.");
      }
      // Build the invitation room in the existing room manager. Both clients
      // join through the ordinary authenticated socket flow; no parallel game
      // state or special challenge game engine is introduced.
      const room = createRoom(challenge.game_id, { id: challenge.sender_id, username: challenge.sender_username });
      createdRoomCode = room.code;
      addPlayer(room.code, { id: challenge.receiver_id, username: challenge.receiver_username });
      for (const player of room.players) {
        player.connected = false;
        player.socketId = null;
      }
      await client.query(
        "UPDATE game_challenges SET status='accepted', room_code=$2, responded_at=NOW() WHERE id=$1",
        [challengeId, room.code],
      );
    } else {
      await client.query(
        "UPDATE game_challenges SET status='rejected', responded_at=NOW() WHERE id=$1",
        [challengeId],
      );
    }
    senderId = challenge.sender_id;
    await client.query("COMMIT");

    if (action === "accept") {
      const accepted = { challengeId, action, roomCode: createdRoomCode, gameId: challenge.game_id };
      notifyUser(req, senderId, "game-challenge-responded", accepted);
      notifyUser(req, req.user.id, "game-challenge-responded", accepted);
      return res.json({ success: true, status: "accepted", roomCode: createdRoomCode, gameId: challenge.game_id });
    }
    const response = { challengeId, action };
    notifyUser(req, senderId, "game-challenge-responded", response);
    return res.json({ success: true, status: "rejected" });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { /* transaction already ended */ }
    if (createdRoomCode) deleteRoom(createdRoomCode);
    console.error("Game challenge response failed.", error?.message || "Database error.");
    return fail(res, 500, "Unable to respond to that challenge right now.");
  } finally {
    client.release();
  }
}
