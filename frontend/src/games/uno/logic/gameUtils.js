export function directionLabel(direction) {
    return direction === -1 ? "COUNTER-CLOCKWISE" : "CLOCKWISE";
}

export function colorLabel(color) {
    return color ? color.toUpperCase() : "—";
}
