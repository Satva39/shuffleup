import React from "react";
import SuitRow from "./SuitRow";

export default function CardLayout({ layout }) {
    return (
        <div className="sps-board">
            {['spades', 'hearts', 'diamonds', 'clubs'].map((suit) => (
                <SuitRow key={suit} suit={suit} cards={layout?.[suit]?.cards || []} />
            ))}
        </div>
    );
}
