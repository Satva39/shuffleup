import { contractLabel } from "../logic/contract";
import { SEAT_LABELS } from "../logic/gameState";

export default function ContractDisplay({ contract, vulnerability }) {
    if (!contract) return null;
    return (
        <section className="bridge-contract-card">
            <div>
                <span className="bridge-eyebrow">CONTRACT</span>
                <strong>{contractLabel(contract)}</strong>
            </div>
            <div className="bridge-contract-detail">Declarer <b>{SEAT_LABELS[contract.declarer]}</b></div>
            <div className="bridge-contract-detail">Dummy <b>{SEAT_LABELS[contract.dummy]}</b></div>
            <div className="bridge-contract-detail">{contract.strain === "NT" ? "NO TRUMP" : `TRUMP ${contract.strain}`}</div>
            <div className="bridge-contract-detail">Vulnerability <b>{vulnerability}</b></div>
        </section>
    );
}
