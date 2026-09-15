import React from "react";

export default function ClaimHistory({ history = [] }) {
    return (
        <aside className="bluff-history">
            <div className="panel-title">RECENT CLAIMS</div>
            {history.length === 0 ? (
                <p className="bluff-empty">Claims will appear here.</p>
            ) : (
                <div className="history-list">
                    {[...history].reverse().map((item) => (
                        <div className="history-item" key={item.id}>
                            <div>
                                <strong>{item.playerName}</strong>
                                <span>{item.count} × {item.rank}</span>
                            </div>
                            {item.result && <b className={item.result === "BLUFF" ? "result-bluff" : "result-truth"}>{item.result}</b>}
                        </div>
                    ))}
                </div>
            )}
        </aside>
    );
}
