export default function GameStatus({ connected, error }) { return <>{!connected && <div className="rummy-connection">RECONNECTING…</div>}{error && <div className="rummy-error">{error}</div>}</>; }
