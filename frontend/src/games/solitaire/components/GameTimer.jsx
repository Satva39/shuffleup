import { useEffect, useState } from "react";

function formatTime(seconds) {
    const value = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(value / 60);
    const remainder = value % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function GameTimer({
    startedAt,
    completionSeconds,
    completed,
}) {
    const [seconds, setSeconds] = useState(() =>
        completed
            ? completionSeconds || 0
            : Math.floor((Date.now() - startedAt) / 1000)
    );

    useEffect(() => {
        if (completed) {
            setSeconds(completionSeconds || 0);
            return undefined;
        }

        function update() {
            setSeconds(
                Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
            );
        }

        update();
        const timer = window.setInterval(update, 1000);

        return () => window.clearInterval(timer);
    }, [completed, completionSeconds, startedAt]);

    return (
        <div className="game-timer">
            <span>TIME</span>
            <strong>{formatTime(seconds)}</strong>
        </div>
    );
}
