import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import { games } from "../../data/games";
import { getGameHistory } from "../../utils/gameHistory";
import "./Stats.css";

function Stats() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [history, setHistory] = useState({});
  const [serverStats, setServerStats] = useState(null);
  const [serverStatsError, setServerStatsError] = useState("");
  useEffect(() => {
    if (!loading && !user)
      navigate(`/login?redirect=${encodeURIComponent("/stats")}`, {
        replace: true,
      });
  }, [loading, user, navigate]);
  useEffect(() => {
    setHistory(getGameHistory(user?.id || "guest"));
  }, [user?.id]);
  useEffect(() => {
    let active = true;
    async function loadPersistentStats() {
      const token = localStorage.getItem("shuffleup_token");
      if (!user || !token || user.isGuest) {
        setServerStats(null);
        return;
      }
      try {
        const baseUrl = (
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        ).replace(/\/$/, "");
        const response = await fetch(`${baseUrl}/api/stats/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(
            data.message || "Completed-match history is unavailable.",
          );
        if (active) {
          setServerStats(data);
          setServerStatsError("");
        }
      } catch (error) {
        if (active) {
          setServerStats(null);
          setServerStatsError(
            error.message || "Completed-match history is unavailable.",
          );
        }
      }
    }
    if (!loading) void loadPersistentStats();
    return () => {
      active = false;
    };
  }, [user?.id, loading]);

  const rows = useMemo(
    () =>
      games
        .map((game) => ({
          ...game,
          plays: Math.max(0, Number(history[game.id]?.plays) || 0),
          lastPlayedAt: Math.max(
            0,
            Number(history[game.id]?.lastPlayedAt) || 0,
          ),
        }))
        .sort(
          (a, b) =>
            b.plays - a.plays ||
            b.lastPlayedAt - a.lastPlayedAt ||
            a.name.localeCompare(b.name),
        ),
    [history],
  );
  const trackedPlays = rows.reduce((total, row) => total + row.plays, 0);
  const gamesOpened = rows.filter((row) => row.plays > 0).length;
  const maxPlays = Math.max(1, ...rows.map((row) => row.plays));
  const mostPlayed = rows.find((row) => row.plays > 0);
  const recent = [...rows]
    .filter((row) => row.lastPlayedAt > 0)
    .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
    .slice(0, 5);
  if (loading || !user) return null;

  return (
    <div className="stats-page">
      <Navbar />
      <main className="stats-container">
        <header className="stats-heading">
          <p className="eyebrow">YOUR ACTIVITY</p>
          <h1>Game dashboard</h1>
          <p>
            See which games you open most and what you have played recently.
          </p>
        </header>
        <div className="stats-note" role="note">
          Completed matches are stored on the server when a game emits a
          confirmed completion event and the database migration has been
          applied. The local launch counts below only mean that you opened a
          game screen; they are not match results.
        </div>
        {serverStatsError && (
          <div className="stats-note" role="status">
            Server match history is currently unavailable: {serverStatsError}
          </div>
        )}
        {serverStats && (
          <>
            <section
              className="stats-overview stats-match-overview"
              aria-label="Completed match statistics"
            >
              <article className="stats-metric">
                <span>Completed matches</span>
                <strong>{serverStats.overall?.gamesPlayed ?? 0}</strong>
                <small>Server-recorded results</small>
              </article>
              <article className="stats-metric">
                <span>Wins / losses</span>
                <strong>
                  {serverStats.overall?.wins ?? 0} /{" "}
                  {serverStats.overall?.losses ?? 0}
                </strong>
                <small>Only identified outcomes</small>
              </article>
              <article className="stats-metric">
                <span>Win rate</span>
                <strong>
                  {serverStats.overall?.winRate == null
                    ? "—"
                    : `${serverStats.overall.winRate}%`}
                </strong>
                <small>Draw/unknown results excluded</small>
              </article>
            </section>
            <div className="stats-columns">
              <section className="stats-panel">
                <div className="stats-panel-heading">
                  <h2>Completed matches by game</h2>
                  <span>{serverStats.byGame?.length || 0} games</span>
                </div>
                {(serverStats.byGame || []).length ? (
                  serverStats.byGame.map((row) => {
                    const name =
                      games.find((game) => game.id === row.gameId)?.name ||
                      row.gameId;
                    const maximum = Math.max(
                      1,
                      ...(serverStats.byGame || []).map(
                        (item) => Number(item.gamesPlayed) || 0,
                      ),
                    );
                    return (
                      <div className="stats-bar-row" key={row.gameId}>
                        <div className="stats-bar-label">
                          <span>{name}</span>
                          <strong>
                            {row.gamesPlayed} matches · {row.wins}W /{" "}
                            {row.losses}L
                          </strong>
                        </div>
                        <div className="stats-bar-track">
                          <div
                            className="stats-bar-fill"
                            style={{
                              width: `${Math.max(0, Math.min(100, (Number(row.gamesPlayed) / maximum) * 100))}%`,
                            }}
                          />
                        </div>
                        <small className="stats-history-caption">
                          Win rate{" "}
                          {row.winRate == null ? "unknown" : `${row.winRate}%`}{" "}
                          · {row.unknownResults || 0} unknown result(s)
                        </small>
                      </div>
                    );
                  })
                ) : (
                  <p className="stats-empty">
                    No completed matches have been recorded for this account
                    yet.
                  </p>
                )}
              </section>
              <section className="stats-panel">
                <div className="stats-panel-heading">
                  <h2>Recent completed matches</h2>
                  <span>{serverStats.recent?.length || 0}</span>
                </div>
                {(serverStats.recent || []).length ? (
                  serverStats.recent.map((match) => (
                    <div className="stats-recent-row" key={match.id}>
                      <div>
                        <strong>
                          {games.find((game) => game.id === match.game_id)
                            ?.name || match.game_id}
                        </strong>
                        <small>
                          {String(match.mode || "multiplayer").replaceAll(
                            "-",
                            " ",
                          )}{" "}
                          · {match.outcome || "unknown result"}
                        </small>
                      </div>
                      <time>
                        {match.completed_at
                          ? new Date(match.completed_at).toLocaleDateString()
                          : "—"}
                      </time>
                    </div>
                  ))
                ) : (
                  <p className="stats-empty">
                    Your completed match history will appear here after
                    supported game results are recorded.
                  </p>
                )}
                <p className="stats-history-caption">{serverStats.note}</p>
              </section>
            </div>
            <section className="stats-panel stats-trend-panel">
              <div className="stats-panel-heading">
                <h2>Match activity · last 30 days</h2>
                <span>
                  {(serverStats.daily || []).reduce(
                    (sum, item) => sum + Number(item.gamesPlayed || 0),
                    0,
                  )}{" "}
                  matches
                </span>
              </div>
              {(() => {
                const daily = serverStats.daily || [];
                const maximum = Math.max(
                  1,
                  ...daily.map((item) => Number(item.gamesPlayed) || 0),
                );
                return daily.length ? (
                  <div
                    className="stats-daily-chart"
                    role="img"
                    aria-label="Bar chart of completed matches per day over the last 30 days"
                  >
                    {daily.map((item) => (
                      <div
                        className="stats-daily-column"
                        key={item.day}
                        title={`${item.day}: ${item.gamesPlayed} matches, ${item.wins} wins, ${item.losses} losses`}
                      >
                        <div className="stats-daily-track">
                          <div
                            className="stats-daily-fill"
                            style={{
                              height: `${Math.max(Number(item.gamesPlayed) ? 5 : 0, (Number(item.gamesPlayed) / maximum) * 100)}%`,
                            }}
                          />
                        </div>
                        <span>{item.day.slice(8)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="stats-empty">
                    Daily trends will appear after completed matches are
                    recorded.
                  </p>
                );
              })()}
              <p className="stats-history-caption">
                Bars count server-recorded completed matches. A zero bar means
                no completed match was recorded for that date.
              </p>
            </section>
          </>
        )}
        <section className="stats-overview">
          <article className="stats-metric">
            <span>Game launches</span>
            <strong>{trackedPlays}</strong>
            <small>Recorded on this device</small>
          </article>
          <article className="stats-metric">
            <span>Games explored</span>
            <strong>
              {gamesOpened} / {games.length}
            </strong>
            <small>Distinct games opened</small>
          </article>
          <article className="stats-metric">
            <span>Most opened</span>
            <strong className="stats-metric-name">
              {mostPlayed?.name || "—"}
            </strong>
            <small>
              {mostPlayed
                ? `${mostPlayed.plays} launches`
                : "Open a game to begin"}
            </small>
          </article>
        </section>
        <div className="stats-columns">
          <section className="stats-panel">
            <div className="stats-panel-heading">
              <h2>Plays by game</h2>
              <span>{trackedPlays} total</span>
            </div>
            {rows.map((row) => (
              <div className="stats-bar-row" key={row.id}>
                <div className="stats-bar-label">
                  <span>{row.name}</span>
                  <strong>{row.plays}</strong>
                </div>
                <div
                  className="stats-bar-track"
                  aria-label={`${row.name}: ${row.plays} game screen launches`}
                >
                  <div
                    className="stats-bar-fill"
                    style={{ width: `${(row.plays / maxPlays) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </section>
          <section className="stats-panel">
            <div className="stats-panel-heading">
              <h2>Recently opened</h2>
              <span>{recent.length}</span>
            </div>
            {recent.length ? (
              recent.map((row) => (
                <div className="stats-recent-row" key={row.id}>
                  <div>
                    <strong>{row.name}</strong>
                    <small>{row.plays} launches</small>
                  </div>
                  <time dateTime={new Date(row.lastPlayedAt).toISOString()}>
                    {new Date(row.lastPlayedAt).toLocaleDateString()}
                  </time>
                </div>
              ))
            ) : (
              <p className="stats-empty">
                Your recent games will appear here after you start opening
                games.
              </p>
            )}
            <button
              className="stats-browse-button"
              type="button"
              onClick={() => navigate("/#games")}
            >
              Browse games
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Stats;
