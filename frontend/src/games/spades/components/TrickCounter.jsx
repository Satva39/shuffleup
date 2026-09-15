import React from "react";

export default function TrickCounter({ count = 0 }) {
    return <span className="trick-counter">Tricks {count} / 13</span>;
}
