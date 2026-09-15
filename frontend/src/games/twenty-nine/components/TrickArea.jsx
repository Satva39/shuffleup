import PlayingCard from "./PlayingCard";

export default function TrickArea({ trick = [], players = [] }) {
    return (
        <section className="twenty-nine-trick-area">
            <div className="twenty-nine-trick-head">
                <span>Current Trick</span>
                <small>{trick.length}/4 cards</small>
            </div>
            <div className="twenty-nine-trick-cards">
                {trick.length === 0 ? (
                    <div className="twenty-nine-trick-empty">Lead a card to begin the trick.</div>
                ) : trick.map((play) => {
                    const player = players.find((item) => item.id === play.playerId);
                    return (
                        <div className="twenty-nine-trick-play" key={`${play.playerId}-${play.card.id}`}>
                            <PlayingCard card={play.card} selectable={false} />
                            <span>{player?.username || play.seat}</span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
