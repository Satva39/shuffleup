import { bidLabel } from "./bidding";

export function contractLabel(contract) {
    if (!contract) return "Passed Out";
    const base = bidLabel(contract);
    return `${base}${contract.doubled === 2 ? "XX" : contract.doubled === 1 ? "X" : ""}`;
}
