import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../services/socket";
import { games } from "../../data/games";
import "./PlayWithBots.css";
import { API_BASE_URL } from "../../services/apiBase";

const API_URL = API_BASE_URL;
const SOLITAIRE_ID = "solitaire";

function getGameMeta(gameId) {
  return games.find((game) => game.id === gameId) || null;
}

export default function PlayWithBots() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedGameId = searchParams.get("game") || "";
  const { user } = useAuth();
  const isDemo = !user && Boolean(localStorage.getItem("shuffleup_demo_token"));
  const [configs, setConfigs] = useState([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [botCount, setBotCount] = useState(1);
  const [botPersona, setBotPersona] = useState("mix");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [impossibleChallenge, setImpossibleChallenge] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadConfig() {
      try {
        const response = await fetch(`${API_URL}/api/game-config`);
        if (!response.ok) throw new Error("Could not load game configuration.");
        const payload = await response.json();
        const supported = Array.isArray(payload.botGames)
          ? payload.botGames.filter((game) => game.gameId !== SOLITAIRE_ID)
          : [];
        if (!active) return;
        setConfigs(supported);
        const requestedConfig = supported.find(
          (game) => game.gameId === requestedGameId,
        );
        const initialConfig = requestedConfig || supported[0];
        if (initialConfig) {
          setSelectedGame(initialConfig.gameId);
          setBotCount(initialConfig.minBots);
          if (requestedGameId && !requestedConfig) {
            setError("That game does not currently support bot mode. Choose another game.");
          }
        } else {
          setError("No bot-supported games are currently available.");
        }
      } catch (loadError) {
        if (active) setError(loadError.message || "Could not load bot games.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadConfig();
    return () => {
      active = false;
    };
  }, [requestedGameId]);

  const selectedConfig = useMemo(
    () => configs.find((game) => game.gameId === selectedGame) || null,
    [configs, selectedGame],
  );

  function selectGame(gameId) {
    const config = configs.find((game) => game.gameId === gameId);
    setSelectedGame(gameId);
    setBotCount(config?.minBots ?? 1);
    setImpossibleChallenge(false);
    setError("");
  }

  function changeBotCount(delta) {
    if (!selectedConfig) return;
    setBotCount((current) =>
      Math.min(
        selectedConfig.maxBots,
        Math.max(selectedConfig.minBots, current + delta),
      ),
    );
  }

  function startBotGame() {
    const activeDemoToken = localStorage.getItem("shuffleup_demo_token");
    if (!user && !activeDemoToken) {
      navigate("/login");
      return;
    }
    if (impossibleChallenge && (!user || isDemo)) {
      setError("Impossible Challenge requires a registered account.");
      return;
    }
    if (!selectedConfig) {
      setError("Select a game first.");
      return;
    }

    setError("");
    setStarting(true);
    if (!socket.connected) socket.connect();

    socket.emit(
      "create-bot-game",
      { gameId: selectedGame, botCount, botPersona, challengeMode: impossibleChallenge ? "impossible" : null },
      (response) => {
        if (!response?.success) {
          setStarting(false);
          setError(response?.message || "Could not start the bot game.");
          return;
        }
        sessionStorage.setItem("shuffleup:last-game-mode", "bots");
        sessionStorage.setItem("shuffleup:last-game-id", selectedGame);
        navigate(`/games/${selectedGame}/${response.room.code}`);
      },
    );
  }

  const visibleGames = configs
    .map((config) => ({ config, meta: getGameMeta(config.gameId) }))
    .filter(({ config }) => config.gameId !== SOLITAIRE_ID);

  return (
    <main className="bot-page">
      <div className="bot-page-shell">
        <button
          className="bot-back"
          type="button"
          onClick={() => navigate("/lobby")}
        >
          ← Back to Lobby
        </button>

        <header className="bot-page-header">
          <p>SHUFFLEUP SINGLE PLAYER</p>
          <h1>Play With Bots</h1>
          <span>
            Pick a game, choose your opponents, and start a real server-side
            table.
          </span>
        </header>

        {loading ? (
          <section className="bot-loading">Loading supported games…</section>
        ) : (
          <div className="bot-setup-grid">
            <section className="bot-setup-card bot-game-card">
              <div className="bot-step">01</div>
              <div className="bot-card-heading">
                <div>
                  <h2>Select Game</h2>
                  <p>Only games with bot support are shown.</p>
                </div>
                <span className="bot-standard-pill">{impossibleChallenge ? "IMPOSSIBLE CHALLENGE" : isDemo ? "2-MINUTE DEMO" : "STANDARD"}</span>
              </div>

              <div className="bot-game-list">
                {visibleGames.map(({ config, meta }) => (
                  <button
                    key={config.gameId}
                    type="button"
                    className={`bot-game-option ${selectedGame === config.gameId ? "selected" : ""}`}
                    onClick={() => selectGame(config.gameId)}
                  >
                    <span className="bot-game-name">
                      {meta?.name || config.gameId}
                    </span>
                    <span className="bot-game-limit">
                      {config.minPlayers === config.maxPlayers
                        ? `Only ${config.minPlayers} Players`
                        : `${config.minPlayers}–${config.maxPlayers} Players`}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {selectedGame === "war" && (
              <section className="bot-setup-card bot-challenge-card">
                <div className="bot-step">SPECIAL MODE</div>
                <h2>Impossible Challenge</h2>
                <p>This mode deliberately overrides War battle results so the challenge bot wins. It is an explicitly unfair mode, not a fair rules-only opponent.</p>
                <label className="bot-challenge-toggle">
                  <input type="checkbox" checked={impossibleChallenge} disabled={isDemo} onChange={(event) => { setImpossibleChallenge(event.target.checked); if (event.target.checked) setBotCount(1); }} />
                  <span>Enable disclosed bot advantage {isDemo ? "(sign in required)" : ""}</span>
                </label>
              </section>
            )}

            <section className="bot-setup-card bot-count-card">
              <div className="bot-step">02</div>
              <h2>Number of Bots</h2>
              <p>One human player plus a valid number of computer players.</p>

              {selectedConfig ? (
                <>
                  <div className="bot-count-picker">
                    <button
                      type="button"
                      aria-label="Decrease bot count"
                      onClick={() => changeBotCount(-1)}
                      disabled={botCount <= selectedConfig.minBots}
                    >
                      −
                    </button>
                    <div>
                      <strong>{botCount}</strong>
                      <span>bots</span>
                    </div>
                    <button
                      type="button"
                      aria-label="Increase bot count"
                      onClick={() => changeBotCount(1)}
                      disabled={botCount >= selectedConfig.maxBots}
                    >
                      +
                    </button>
                  </div>
                  <div className="bot-total-preview">
                    <span>Table size</span>
                    <strong>
                      1 Human + {botCount} Bot{botCount === 1 ? "" : "s"}
                    </strong>
                  </div>
                  <div className="bot-limit-note">
                    Valid: {selectedConfig.minBots}–{selectedConfig.maxBots}{" "}
                    bots
                  </div>
                  <div className="bot-persona-picker" aria-labelledby="bot-persona-label">
                    <h3 id="bot-persona-label">Bot personality</h3>
                    <p>Choose the voice style for your opponents. Voice can be muted during the game.</p>
                    <div className="bot-persona-options">
                      {[{ value: "mix", label: "Mixed", detail: "Arjun + Maya" }, { value: "male", label: "Male", detail: "Arjun & male voices" }, { value: "female", label: "Female", detail: "Maya & female voices" }].map((item) => <button key={item.value} type="button" className={`bot-persona-option ${botPersona === item.value ? "selected" : ""}`} aria-pressed={botPersona === item.value} onClick={() => setBotPersona(item.value)}><strong>{item.label}</strong><span>{item.detail}</span></button>)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bot-empty">
                  Select a game to choose its supported table size.
                </div>
              )}
            </section>

            <section className="bot-start-card">
              <div>
                <div className="bot-step">03</div>
                <h2>Start Game</h2>
                <p>
                  The server creates the real room, seats the bots, and runs the
                  existing game engine.
                </p>
              </div>
              <button
                type="button"
                className="bot-start-btn"
                onClick={startBotGame}
                disabled={starting || !selectedConfig}
              >
                {starting ? "Starting…" : "Start Bot Game →"}
              </button>
            </section>
          </div>
        )}

        {error && <div className="bot-error">{error}</div>}
      </div>
    </main>
  );
}
