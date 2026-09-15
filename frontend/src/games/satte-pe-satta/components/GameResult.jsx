import React from "react";

export default function GameResult({ state, onLobby }) {
    if (state?.status !== "complete" || !state.result) return null;

    return (
        <div className="sps-result-card sps-final-result">
            <div className="sps-result-kicker">GAME COMPLETE</div>
            <h2>{state.result.gameWinnerUsername || "Game complete"} wins the game</h2>
            <p>Final scores</p>
            <div className="sps-ranking">
                {state.result.ranking?.map((item) => (
                    <div className="sps-ranking-row" key={item.id}>
                        <span>#{item.rank}</span>
                        <strong>{item.username}</strong>
                        <span>{item.totalPoints} points</span>
                    </div>
                ))}
            </div>
            <button className="sps-lobby-button" type="button" onClick={onLobby}>
                RETURN TO LOBBY
            </button>
        </div>
    );
}
