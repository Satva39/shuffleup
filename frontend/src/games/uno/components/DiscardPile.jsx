import UnoCard from "./UnoCard";

function DiscardPile({ card }) {
    return (
        <div className="uno-discard-wrap">
            <span>DISCARD</span>
            <UnoCard card={card} small />
        </div>
    );
}

export default DiscardPile;
