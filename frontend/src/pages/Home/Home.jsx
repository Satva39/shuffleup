import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import GameCard from "../../components/game-card/GameCard";
import { games } from "../../data/games";
import { gameManuals } from "../../data/gameManuals";
import HowToPlayModal from "../../components/how-to-play/HowToPlayModal";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../services/socket";
import { getGameHistory } from "../../utils/gameHistory";
import "./Home.css";

function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedManual, setSelectedManual] = useState(null);
  const [sortBy, setSortBy] = useState("featured");
  const [gameHistory, setGameHistory] = useState({});
  const [liveCounts, setLiveCounts] = useState({});
  const [activeRoom, setActiveRoom] = useState(null);
  const [startingDemo, setStartingDemo] = useState(false);
  const [demoError, setDemoError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    let cancelled = false;
    const loadCounts = async () => {
      try {
        const response = await fetch(
          `${baseUrl.replace(/\/$/, "")}/api/live-counts`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const result = await response.json();
        if (!cancelled) setLiveCounts(result.games || {});
      } catch {
        // Counts are informational; a temporary endpoint failure must not block the lobby.
      }
    };
    loadCounts();
    const interval = window.setInterval(loadCounts, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setGameHistory(getGameHistory(user?.id || "guest"));
    if (!user || !localStorage.getItem("shuffleup_token")) {
      setActiveRoom(null);
      return undefined;
    }

    const requestActiveRoom = () => {
      if (!socket.connected) return;
      socket.emit("get-my-active-room", (result) => {
        if (cancelled) return;
        if (result?.success && result.room && result.destination)
          setActiveRoom(result);
        else setActiveRoom(null);
      });
    };
    socket.on("connect", requestActiveRoom);
    if (!socket.connected) socket.connect();
    else requestActiveRoom();
    return () => {
      cancelled = true;
      socket.off("connect", requestActiveRoom);
    };
  }, [user?.id]);

  async function startDemo() {
    if (startingDemo) return;
    setStartingDemo(true);
    setDemoError("");
    try {
      const baseUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:5000"
      ).replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/api/demo/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token)
        throw new Error(data.message || "Demo is currently unavailable.");
      localStorage.setItem("shuffleup_demo_token", data.token);
      localStorage.setItem("shuffleup_demo_expires_at", String(data.expiresAt));
      window.dispatchEvent(new Event("shuffleup-demo-started"));
      if (socket.connected) socket.disconnect();
      socket.connect();
      navigate("/play-with-bots?demo=1");
    } catch (error) {
      setDemoError(error?.message || "Could not start the demo.");
    } finally {
      setStartingDemo(false);
    }
  }

  const categories = ["All", "Classic", "Trick Taking", "Casual"];

  const filteredGames = useMemo(() => {
    const filtered = games.filter((game) => {
      const matchesSearch = game.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory = category === "All" || game.category === category;
      return matchesSearch && matchesCategory;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "most-played")
        return (
          (gameHistory[b.id]?.plays || 0) - (gameHistory[a.id]?.plays || 0) ||
          a.name.localeCompare(b.name)
        );
      if (sortBy === "recent")
        return (
          (gameHistory[b.id]?.lastPlayedAt || 0) -
            (gameHistory[a.id]?.lastPlayedAt || 0) ||
          a.name.localeCompare(b.name)
        );
      return (
        games.findIndex((item) => item.id === a.id) -
        games.findIndex((item) => item.id === b.id)
      );
    });
  }, [search, category, sortBy, gameHistory]);

  return (
    <div className="home">
      <Navbar />

      <main>
        {activeRoom?.room && (
          <section className="rejoin-active-room" aria-live="polite">
            <div>
              <strong>Your game is still available</strong>
              <span>
                {games.find((game) => game.id === activeRoom.room.gameId)
                  ?.name || activeRoom.room.gameId}{" "}
                · Room {activeRoom.room.code}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate(activeRoom.destination)}
            >
              Rejoin game
            </button>
          </section>
        )}
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">WELCOME TO SHUFFLEUP</p>

            <h1>
              Play Cards.
              <br />
              <span>Connect. Compete.</span>
            </h1>

            <p className="hero-description">
              Classic card games, multiplayer rooms and friendly competition —
              all in one place.
            </p>

            <div className="hero-buttons">
              <a href="#games" className="primary-btn">
                Explore Games
              </a>

              <a href="#how-it-works" className="secondary-btn">
                How It Works
              </a>
              {!user && (
                <button
                  type="button"
                  className="secondary-btn demo-start-button"
                  onClick={startDemo}
                  disabled={startingDemo}
                >
                  {startingDemo ? "Starting demo…" : "Try 2-minute demo"}
                </button>
              )}
            </div>
            {demoError && (
              <p role="alert" className="demo-start-error">
                {demoError}
              </p>
            )}
          </div>

          <div className="hero-cards">
            <div className="floating-card card-one">A♠</div>
            <div className="floating-card card-two">K♥</div>
            <div className="floating-card card-three">7♦</div>
          </div>
        </section>

        <section className="games-section" id="games">
          <div className="section-heading">
            <div>
              <p className="eyebrow">OUR COLLECTION</p>
              <h2>Choose Your Game</h2>
            </div>

            <p>{filteredGames.length} games available</p>
          </div>

          <div className="game-controls">
            <input
              type="text"
              placeholder="Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="game-sort-control">
              <label htmlFor="game-sort">Sort games</label>
              <select
                id="game-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="name">Name A–Z</option>
                <option value="most-played">Most played on this device</option>
                <option value="recent">Recently played</option>
              </select>
            </div>

            <div className="categories">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="games-grid">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                liveCount={liveCounts[game.id]?.connectedHumans}
                onHowToPlay={(selectedGame) =>
                  setSelectedManual(gameManuals[selectedGame.id] || null)
                }
              />
            ))}
          </div>

          {filteredGames.length === 0 && (
            <div className="no-games">
              <h3>No games found</h3>
              <p>Try another search.</p>
            </div>
          )}
        </section>

        <section className="how-section" id="how-it-works">
          <p className="eyebrow">SIMPLE TO START</p>
          <h2>How It Works</h2>

          <div className="steps">
            <div className="step">
              <span>01</span>
              <h3>Choose a Game</h3>
              <p>Pick one of our multiplayer card games.</p>
            </div>

            <div className="step">
              <span>02</span>
              <h3>Create or Join</h3>
              <p>Create a private room or join your friends.</p>
            </div>

            <div className="step">
              <span>03</span>
              <h3>Shuffle Up</h3>
              <p>Play together in real time and have fun.</p>
            </div>
          </div>
        </section>

        <section className="about-section" id="about">
          <p className="eyebrow">ABOUT SHUFFLEUP</p>

          <h2>
            One place for the card games
            <br />
            you love.
          </h2>

          <p>
            ShuffleUp is being built as a multiplayer card-game platform where
            classic games can be played with friends and other players.
          </p>
        </section>
      </main>

      {selectedManual && (
        <HowToPlayModal
          manual={selectedManual}
          onClose={() => setSelectedManual(null)}
        />
      )}

      <footer>
        <strong>ShuffleUp</strong>
        <span>Play Cards. Connect. Compete.</span>
      </footer>
    </div>
  );
}

export default Home;
