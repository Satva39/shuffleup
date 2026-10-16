import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState, useRef } from "react";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { recordGamePlayed } from "./utils/gameHistory";
import { startFreshGame } from "./utils/startFreshGame";
import { socket } from "./services/socket";
import {
  getSoundVolume,
  isMusicEnabled,
  isSoundEnabled,
  playGameSound,
  setMusicEnabled,
  setSoundEnabled,
  setSoundVolume,
} from "./utils/gameAudio";
import "./components/game-navigation-tools.css";
import GameExperienceBridge, {
  DemoSessionBridge,
} from "./components/game-experience/GameExperienceBridge";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Lobby from "./pages/Lobby/Lobby";
import Room from "./pages/Room/Room";
import Profile from "./pages/Profile/Profile";
import PlayWithBots from "./pages/PlayWithBots/PlayWithBots";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Social from "./pages/Social/Social";
import Stats from "./pages/Stats/Stats";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";

// Games
import { KachufulGame } from "./games/kachuful";
import { TeenPattiGame } from "./games/teen-patti";
import { IndianRummyGame } from "./games/indian-rummy";
import { MangooseGame } from "./games/mangoose";
import { UnoGame } from "./games/uno";
import { JackThiefGame } from "./games/jack-thief";
import { NapoleonGame } from "./games/napoleon";
import { BridgeGame } from "./games/bridge";
import { SpadesGame } from "./games/spades";
import { TwentyNineGame } from "./games/twenty-nine";
import { MindiCoatGame } from "./games/mindi-coat";
import { BluffGame } from "./games/bluff";
import { SattePeSattaGame } from "./games/satte-pe-satta";
import { WarGame } from "./games/war";
import { SolitaireGame } from "./games/solitaire";

function GameHistoryTracker() {
  const location = useLocation();
  const { user } = useAuth();

  const lastRecordedRef = useRef(null);
  useEffect(() => {
    const match = location.pathname.match(/^\/games\/([a-z0-9-]+)\/[^/]+\/?$/i);
    if (!match) {
      lastRecordedRef.current = null;
      return;
    }
    const key = `${location.pathname}:${user?.id || "guest"}`;
    if (lastRecordedRef.current === key) return;
    lastRecordedRef.current = key;
    recordGamePlayed(user?.id || "guest", match[1].toLowerCase());
  }, [location.pathname, user?.id]);

  return null;
}

function GameNavigationTools() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [musicOn, setMusicOn] = useState(isMusicEnabled());
  const [volume, setVolume] = useState(getSoundVolume());
  const [lastPlayed, setLastPlayed] = useState(null);
  const [voiceOn, setVoiceOn] = useState(
    () => localStorage.getItem("shuffleup_bot_voice") === "1",
  );
  const [voiceVolume, setVoiceVolume] = useState(() =>
    Math.max(
      0,
      Math.min(
        1,
        Number(localStorage.getItem("shuffleup_bot_voice_volume") || 0.7),
      ),
    ),
  );
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(
    () => localStorage.getItem("shuffleup_bot_voice_uri") || "",
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const match = location.pathname.match(/^\/games\/([a-z0-9-]+)\/([^/]+)\/?$/i);
  const gameId = match ? match[1].toLowerCase() : null;
  const roomCode = match ? match[2].toUpperCase() : null;

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis)
      return undefined;
    const load = () => setAvailableVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () =>
      window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnOutsidePress = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  function updateVoiceOn(next) {
    localStorage.setItem("shuffleup_bot_voice", next ? "1" : "0");
    setVoiceOn(next);
    window.dispatchEvent(
      new CustomEvent("shuffleup-bot-voice-settings", {
        detail: { enabled: next },
      }),
    );
  }
  function updateVoiceVolume(next) {
    const value = Math.max(0, Math.min(1, Number(next)));
    localStorage.setItem("shuffleup_bot_voice_volume", String(value));
    setVoiceVolume(value);
    window.dispatchEvent(
      new CustomEvent("shuffleup-bot-voice-settings", {
        detail: { volume: value },
      }),
    );
  }
  function updateSelectedVoice(next) {
    localStorage.setItem("shuffleup_bot_voice_uri", next);
    setSelectedVoice(next);
    window.dispatchEvent(
      new CustomEvent("shuffleup-bot-voice-settings", {
        detail: { voiceURI: next },
      }),
    );
  }

  useEffect(() => {
    if (!gameId) {
      setLastPlayed(null);
      return undefined;
    }
    const handleEvent = (eventName, payload) => {
      const lowerEventName = String(eventName || "").toLowerCase();
      const isPublicCardPlay = lowerEventName.endsWith("card-played");
      const isPublicDiscard =
        lowerEventName.endsWith(":discard") &&
        lowerEventName.startsWith("indian-rummy:");
      if (!isPublicCardPlay && !isPublicDiscard) return;
      const card = payload?.card || payload?.discard || payload?.playedCard;
      if (!card) return;
      const suit =
        typeof card === "object" ? card.suit || card.color || "" : "";
      const rank =
        typeof card === "object"
          ? card.rank || card.value || card.name || card.label || ""
          : card;
      const suitSymbol =
        {
          S: "♠",
          SPADES: "♠",
          H: "♥",
          HEARTS: "♥",
          D: "♦",
          DIAMONDS: "♦",
          C: "♣",
          CLUBS: "♣",
        }[String(suit).toUpperCase()] || suit;
      const cardLabel =
        [rank, suitSymbol].filter(Boolean).join(" ") || "Card played";
      const playerName =
        payload?.playerName ||
        payload?.username ||
        (payload?.playerId === user?.id ? "You" : "Another player");
      setLastPlayed({
        cardLabel: String(cardLabel),
        playerName: String(playerName),
        eventName,
      });
    };
    socket.onAny(handleEvent);
    return () => socket.offAny(handleEvent);
  }, [gameId, user?.id]);

  if (!match) return null;

  const goHome = () => {
    setMenuOpen(false);
    navigate("/");
  };
  const goToLobby = () => {
    setMenuOpen(false);
    navigate(`/lobby?game=${encodeURIComponent(gameId)}`);
  };
  const beginNewGame = () => {
    setMenuOpen(false);
    startFreshGame(gameId, roomCode, navigate);
  };

  return (
    <>
      {lastPlayed && (
        <aside
          className="last-played-card-toast"
          aria-live="polite"
          aria-label="Last card played"
        >
          <span className="last-played-card-label">LAST PLAY</span>
          <strong>{lastPlayed.cardLabel}</strong>
          <span>{lastPlayed.playerName}</span>
          <button
            type="button"
            aria-label="Dismiss last played card"
            onClick={() => setLastPlayed(null)}
          >
            ×
          </button>
        </aside>
      )}
      <div
        className={`game-navigation-tools${menuOpen ? " is-open" : ""}`}
        ref={menuRef}
      >
        <button
          type="button"
          className="game-menu-toggle"
          aria-label={menuOpen ? "Close game controls" : "Open game controls"}
          title={menuOpen ? "Close game controls" : "Open game controls"}
          aria-expanded={menuOpen}
          aria-controls="game-navigation-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="game-menu-toggle-icon" aria-hidden="true">
            {menuOpen ? "×" : "☰"}
          </span>
        </button>
        {menuOpen && (
          <nav
            id="game-navigation-menu"
            className="game-navigation-menu"
            aria-label="Game controls"
          >
            <div className="game-navigation-menu-heading">
              <strong>Game controls</strong>
              <span>{gameId.replace(/-/g, " ")}</span>
            </div>
            <div className="game-navigation-primary-actions">
              <button type="button" onClick={goHome}>
                ⌂ Home
              </button>
              <button type="button" onClick={goToLobby}>
                Lobby
              </button>
            </div>
            <div className="game-navigation-toggle-grid">
              <button
                type="button"
                aria-pressed={soundOn}
                onClick={async () =>
                  setSoundOn(await setSoundEnabled(!soundOn))
                }
              >
                Sound: {soundOn ? "On" : "Off"}
              </button>
              <button
                type="button"
                aria-pressed={musicOn}
                onClick={async () =>
                  setMusicOn(await setMusicEnabled(!musicOn))
                }
              >
                Music: {musicOn ? "On" : "Off"}
              </button>
              <button
                type="button"
                className="game-navigation-wide-action"
                aria-pressed={voiceOn}
                onClick={() => updateVoiceOn(!voiceOn)}
              >
                Bot voice: {voiceOn ? "On" : "Off"}
              </button>
            </div>
            <label
              className="game-menu-setting"
              title="Choose the browser voice used for bot reactions"
            >
              <span>Bot voice</span>
              <select
                aria-label="Choose bot voice"
                value={selectedVoice}
                onChange={(event) => updateSelectedVoice(event.target.value)}
              >
                <option value="">Automatic</option>
                {availableVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="game-menu-setting" title="Bot voice volume">
              <span>
                Bot voice volume{" "}
                <strong>{Math.round(voiceVolume * 100)}%</strong>
              </span>
              <input
                aria-label="Bot voice volume"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceVolume}
                onChange={(event) => updateVoiceVolume(event.target.value)}
              />
            </label>
            <label className="game-menu-setting" title="Game audio volume">
              <span>
                Game sound volume <strong>{Math.round(volume * 100)}%</strong>
              </span>
              <input
                aria-label="Game audio volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(event) =>
                  setVolume(setSoundVolume(event.target.value))
                }
              />
            </label>
            <button type="button" className="new-game" onClick={beginNewGame}>
              New Game
            </button>
          </nav>
        )}
      </div>
    </>
  );
}

function GameAudioBridge() {
  const location = useLocation();
  useEffect(() => {
    if (!/^\/games\//.test(location.pathname)) return undefined;
    const handleEvent = (eventName) => {
      const event = String(eventName || "").toLowerCase();
      if (
        event.includes("card-played") ||
        event.endsWith(":play-card") ||
        event.endsWith(":play")
      )
        playGameSound("card");
      else if (event.includes("draw")) playGameSound("draw");
      else if (event.includes("trick-complete") || event.includes("trick-won"))
        playGameSound("trick");
      else if (event.includes("game-complete") || event.includes("game-won"))
        playGameSound("win");
    };
    socket.onAny(handleEvent);
    return () => socket.offAny(handleEvent);
  }, [location.pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameHistoryTracker />
        <GameAudioBridge />
        <GameExperienceBridge />
        <DemoSessionBridge />
        <GameNavigationTools />
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/lobby" element={<Lobby />} />

          <Route path="/room/:roomCode" element={<Room />} />

          <Route path="/play-with-bots" element={<PlayWithBots />} />

          <Route path="/profile" element={<Profile />} />

          <Route path="/social" element={<Social />} />

          <Route path="/stats" element={<Stats />} />

          <Route path="/games/kachuful/:roomCode" element={<KachufulGame />} />

          <Route
            path="/games/teen-patti/:roomCode"
            element={<TeenPattiGame />}
          />

          <Route
            path="/games/indian-rummy/:roomCode"
            element={<IndianRummyGame />}
          />

          <Route path="/games/mangoose/:roomCode" element={<MangooseGame />} />

          <Route path="/games/uno/:roomCode" element={<UnoGame />} />

          <Route
            path="/games/jack-thief/:roomCode"
            element={<JackThiefGame />}
          />

          <Route path="/games/napoleon/:roomCode" element={<NapoleonGame />} />

          <Route path="/games/bridge/:roomCode" element={<BridgeGame />} />

          <Route path="/games/spades/:roomCode" element={<SpadesGame />} />

          <Route
            path="/games/twenty-nine/:roomCode"
            element={<TwentyNineGame />}
          />

          <Route
            path="/games/mindi-coat/:roomCode"
            element={<MindiCoatGame />}
          />

          <Route path="/games/bluff/:roomCode" element={<BluffGame />} />

          <Route
            path="/games/satte-pe-satta/:roomCode"
            element={<SattePeSattaGame />}
          />

          <Route path="/games/war/:roomCode" element={<WarGame />} />

          <Route
            path="/games/solitaire/:roomCode"
            element={<SolitaireGame />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
