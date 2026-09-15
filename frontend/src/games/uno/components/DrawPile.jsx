import UnoCard from "./UnoCard";

function DrawPile({ canDraw, onDraw }) {
    return (
        <div className={`uno-pile-button ${canDraw ? "uno-pile-active" : ""}`}>
            <button type="button" onClick={onDraw} disabled={!canDraw} aria-label="Draw a card">
                <UnoCard faceDown />
            </button>
            <span>DRAW</span>
        </div>
    );
}

export default DrawPile;
