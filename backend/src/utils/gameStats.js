import pool from "../config/database.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function extractWinnerIds(result, roomPlayers = []) {
  const root = asObject(result);
  const nested = asObject(root.result);
  const explicitWinnerArray = [
    ...(Array.isArray(root.winnerIds) ? root.winnerIds : []),
    ...(Array.isArray(nested.winnerIds) ? nested.winnerIds : []),
  ];
  const candidates = [
    ...explicitWinnerArray,
    root.winnerId, root.winnerID, root.winningPlayerId, root.winnerPlayerId,
    nested.winnerId, nested.winnerID, nested.winningPlayerId, nested.winnerPlayerId,
    root.winner?.id, root.winner?.playerId, nested.winner?.id, nested.winner?.playerId,
    typeof root.winner === "string" && roomPlayers.some((player) => String(player.id) === root.winner) ? root.winner : null,
    typeof nested.winner === "string" && roomPlayers.some((player) => String(player.id) === nested.winner) ? nested.winner : null,
  ].filter((value) => value !== undefined && value !== null).map(String);

  let winnerIds = candidates.filter((id) => roomPlayers.some((player) => String(player.id) === id));
  if (!winnerIds.length) {
    const winnerNames = [root.winnerName, root.winner?.username, root.winner?.name, typeof root.winner === "string" ? root.winner : null, nested.winnerName, nested.winner?.username, nested.winner?.name, typeof nested.winner === "string" ? nested.winner : null]
      .filter(Boolean).map((name) => String(name).toLocaleLowerCase());
    winnerIds = roomPlayers.filter((player) => winnerNames.includes(String(player.username || "").toLocaleLowerCase())).map((player) => String(player.id));
  }
  if (!winnerIds.length && Array.isArray(root.players)) {
    winnerIds = root.players.filter((player) => player?.winner === true || player?.isWinner === true || player?.status === "winner")
      .map((player) => String(player.id || player.playerId || ""));
  }
  if (!winnerIds.length && Array.isArray(nested.players)) {
    winnerIds = nested.players.filter((player) => player?.winner === true || player?.isWinner === true || player?.status === "winner")
      .map((player) => String(player.id || player.playerId || ""));
  }

  // Multiplayer Solitaire exposes an explicit final leaderboard. Rank 1 is a
  // result declared by the authoritative engine, not a score inferred by us.
  if (!winnerIds.length && Array.isArray(root.rankings) && root.status === "complete") {
    const first = root.rankings.filter((row) => Number(row?.rank) === 1);
    winnerIds = first.map((row) => String(row?.id || row?.playerId || ""));
  }
  if (!winnerIds.length && Array.isArray(nested.rankings) && nested.status === "complete") {
    const first = nested.rankings.filter((row) => Number(row?.rank) === 1);
    winnerIds = first.map((row) => String(row?.id || row?.playerId || ""));
  }

  // Jack Thief defines one explicit loser (the player left with the final Jack),
  // rather than a singular winner. All other seats are survivors of that game.
  if (!winnerIds.length && root.loserId !== undefined && root.loserId !== null) {
    const loserId = String(root.loserId);
    if (roomPlayers.some((player) => String(player.id) === loserId)) {
      winnerIds = roomPlayers.filter((player) => String(player.id) !== loserId).map((player) => String(player.id));
    }
  }

  // Team-based games (e.g. Spades/Bridge) expose the winning team on the
  // authoritative completion event. Map only explicitly reported team IDs
  // from that event back to seats; never infer a winner from client state.
  if (!winnerIds.length) {
    const winningTeam = root.winnerTeam ?? root.winningTeam ?? nested.winnerTeam ?? nested.winningTeam;
    const resultPlayers = Array.isArray(root.players) ? root.players : Array.isArray(nested.players) ? nested.players : [];
    if (winningTeam !== undefined && winningTeam !== null && resultPlayers.length) {
      const winningTeamKey = String(winningTeam);
      const winningResultPlayers = resultPlayers.filter((player) => String(player?.team ?? player?.teamId ?? player?.partnership ?? "") === winningTeamKey);
      winnerIds = winningResultPlayers.flatMap((player) => {
        const exactId = String(player?.id || player?.playerId || "");
        const exact = roomPlayers.find((seat) => String(seat.id) === exactId);
        if (exact) return [String(exact.id)];
        const name = String(player?.username || player?.name || "").toLocaleLowerCase();
        const match = name ? roomPlayers.find((seat) => String(seat.username || "").toLocaleLowerCase() === name) : null;
        return match ? [String(match.id)] : [];
      });
    }
  }
  return [...new Set(winnerIds.filter((id) => roomPlayers.some((player) => String(player.id) === id)))];
}

/** Persists only server-emitted completion results. Unknown winners remain unknown. */
export async function recordCompletedMatch({ room, gameId, eventName, result }) {
  if (!room?.code || !Array.isArray(room.players) || !gameId) return { recorded: false, reason: "missing-room" };
  const createdAt = Number(room.createdAt) || Date.now();
  const winnerIds = extractWinnerIds(result, room.players);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO game_matches (room_code, room_created_at, game_id, mode, result_event, result_payload, winner_ids, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::text[], NOW())
       ON CONFLICT (room_code, room_created_at) DO NOTHING
       RETURNING id`,
      [String(room.code).toUpperCase(), createdAt, gameId, room.mode || "multiplayer", String(eventName).slice(0, 100), JSON.stringify(asObject(result)), winnerIds],
    );
    const matchId = inserted.rows[0]?.id;
    if (!matchId) {
      await client.query("COMMIT");
      return { recorded: false, reason: "already-recorded" };
    }

    for (const player of room.players) {
      const playerId = String(player.id || "");
      const registeredUserId = UUID_RE.test(playerId) ? playerId : null;
      const isGeneratedBot = playerId.startsWith("bot:");
      let outcome = "unknown";
      if (winnerIds.includes(playerId)) outcome = "win";
      else if (winnerIds.length) outcome = "loss";
      // Keep generated bots for the audit result but never attach them to user stats.
      await client.query(
        `INSERT INTO game_match_players (match_id, user_id, player_ref, username, is_bot, outcome, score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [matchId, registeredUserId, playerId.slice(0, 120), String(player.username || "Player").slice(0, 30), isGeneratedBot, outcome, Number.isFinite(Number(player.score)) ? Number(player.score) : null],
      );
    }
    await client.query("COMMIT");
    return { recorded: true, matchId, winnerIds };
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { /* transaction already closed */ }
    throw error;
  } finally {
    client.release();
  }
}

export async function getPlayerGameStats(userId) {
  const [overall, byGame, recent, daily] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS games_played,
         COUNT(*) FILTER (WHERE outcome = 'win')::int AS wins,
         COUNT(*) FILTER (WHERE outcome = 'loss')::int AS losses,
         COUNT(*) FILTER (WHERE outcome = 'unknown')::int AS unknown_results
       FROM game_match_players WHERE user_id = $1`, [userId]),
    pool.query(
      `SELECT m.game_id, COUNT(*)::int AS games_played,
         COUNT(*) FILTER (WHERE p.outcome = 'win')::int AS wins,
         COUNT(*) FILTER (WHERE p.outcome = 'loss')::int AS losses,
         COUNT(*) FILTER (WHERE p.outcome = 'unknown')::int AS unknown_results,
         MAX(m.completed_at) AS last_played_at
       FROM game_match_players p JOIN game_matches m ON m.id = p.match_id
       WHERE p.user_id = $1 GROUP BY m.game_id ORDER BY games_played DESC, m.game_id`, [userId]),
    pool.query(
      `SELECT m.id, m.game_id, m.mode, m.completed_at, m.winner_ids, p.outcome,
         (SELECT json_agg(json_build_object('username', other.username, 'outcome', other.outcome, 'isBot', other.is_bot) ORDER BY other.id)
          FROM game_match_players other WHERE other.match_id = m.id) AS players
       FROM game_match_players p JOIN game_matches m ON m.id = p.match_id
       WHERE p.user_id = $1 ORDER BY m.completed_at DESC LIMIT 50`, [userId]),
    pool.query(
      `WITH days AS (
         SELECT generate_series((CURRENT_DATE - INTERVAL '29 days')::date, CURRENT_DATE, INTERVAL '1 day')::date AS day
       )
       SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
         COUNT(p.id)::int AS games_played,
         COUNT(*) FILTER (WHERE p.outcome = 'win')::int AS wins,
         COUNT(*) FILTER (WHERE p.outcome = 'loss')::int AS losses
       FROM days
       LEFT JOIN game_matches m ON m.completed_at >= days.day::timestamptz
         AND m.completed_at < (days.day + INTERVAL '1 day')::timestamptz
       LEFT JOIN game_match_players p ON p.match_id = m.id AND p.user_id = $1
       GROUP BY days.day ORDER BY days.day`, [userId]),
  ]);
  const totals = overall.rows[0] || { games_played: 0, wins: 0, losses: 0, unknown_results: 0 };
  const decided = Number(totals.wins) + Number(totals.losses);
  return {
    overall: {
      gamesPlayed: Number(totals.games_played), wins: Number(totals.wins), losses: Number(totals.losses),
      unknownResults: Number(totals.unknown_results), winRate: decided ? Math.round(Number(totals.wins) / decided * 10000) / 100 : null,
    },
    byGame: byGame.rows.map((row) => ({
      gameId: row.game_id, gamesPlayed: Number(row.games_played), wins: Number(row.wins), losses: Number(row.losses),
      unknownResults: Number(row.unknown_results), lastPlayedAt: row.last_played_at,
      winRate: Number(row.wins) + Number(row.losses) ? Math.round(Number(row.wins) / (Number(row.wins) + Number(row.losses)) * 10000) / 100 : null,
    })),
    recent: recent.rows,
    daily: daily.rows.map((row) => ({
      day: row.day,
      gamesPlayed: Number(row.games_played),
      wins: Number(row.wins),
      losses: Number(row.losses),
    })),
    note: "Only server-emitted game-complete results are stored. If a game's completion event does not identify a winner, that result remains unknown and is not counted as a win or loss.",
  };
}
