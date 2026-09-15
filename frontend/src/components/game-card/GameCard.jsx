import "./GameCard.css";
import { useNavigate } from "react-router-dom";

function GameCard({ game, onHowToPlay }) {

  const navigate = useNavigate();


  return (
    <article className="game-card">
      <div className="game-card-top">
        <div className="playing-card">♠</div>

        <span className="game-category">
          {game.category}
        </span>
      </div>

      <div className="game-card-content">
        <h3>{game.name}</h3>

        <p className="players">
          👥 {game.players}
        </p>

        <p className="game-description">
          {game.description}
        </p>

        <div className="game-actions">
          <button
            type="button"
            className="how-btn"
            onClick={() => onHowToPlay(game)}
          >
            How to Play
          </button>

          <button
            className="play-btn"
            onClick={() => navigate("/lobby")}
          >
            Play Now
          </button>
        </div>
      </div>
    </article>
  );
}

export default GameCard;