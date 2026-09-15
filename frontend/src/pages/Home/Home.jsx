import { useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import GameCard from "../../components/game-card/GameCard";
import { games } from "../../data/games";
import { gameManuals } from "../../data/gameManuals";
import HowToPlayModal from "../../components/how-to-play/HowToPlayModal";
import "./Home.css";

function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedManual, setSelectedManual] = useState(null);

  const categories = [
    "All",
    "Classic",
    "Trick Taking",
    "Casual",
  ];

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || game.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="home">
      <Navbar />

      <main>
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">WELCOME TO SHUFFLEUP</p>

            <h1>
              Play Cards.
              <br />
              <span>Connect. Compete.</span>
            </h1>

            <p className="hero-description">
              Classic card games, multiplayer rooms and
              friendly competition — all in one place.
            </p>

            <div className="hero-buttons">
              <a href="#games" className="primary-btn">
                Explore Games
              </a>

              <a href="#how-it-works" className="secondary-btn">
                How It Works
              </a>
            </div>
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

            <p>
              {filteredGames.length} games available
            </p>
          </div>

          <div className="game-controls">
            <input
              type="text"
              placeholder="Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="categories">
              {categories.map((item) => (
                <button
                  key={item}
                  className={
                    category === item ? "active" : ""
                  }
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
              <p>
                Pick one of our multiplayer card games.
              </p>
            </div>

            <div className="step">
              <span>02</span>
              <h3>Create or Join</h3>
              <p>
                Create a private room or join your friends.
              </p>
            </div>

            <div className="step">
              <span>03</span>
              <h3>Shuffle Up</h3>
              <p>
                Play together in real time and have fun.
              </p>
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
            ShuffleUp is being built as a multiplayer
            card-game platform where classic games can
            be played with friends and other players.
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

export default Home;;