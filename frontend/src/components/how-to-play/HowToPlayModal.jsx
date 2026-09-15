import { useEffect } from "react";
import "./HowToPlayModal.css";

function renderInline(text) {
    const parts = text.split(/(`[^`]+`)/g);

    return parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
            return <code key={index}>{part.slice(1, -1)}</code>;
        }

        return part;
    });
}

function HowToPlayModal({ manual, onClose }) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    if (!manual) {
        return null;
    }

    return (
        <div
            className="how-to-play-overlay"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section
                className="how-to-play-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="how-to-play-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="how-to-play-header">
                    <div>
                        <p className="how-to-play-eyebrow">HOW TO PLAY</p>
                        <h2 id="how-to-play-title">{manual.title}</h2>
                    </div>

                    <button
                        type="button"
                        className="how-to-play-close"
                        onClick={onClose}
                        aria-label={`Close ${manual.title} manual`}
                    >
                        ×
                    </button>
                </div>

                <div className="how-to-play-content">
                    {manual.sections.map((section) => (
                        <section className="manual-section" key={section.heading}>
                            <h3>{section.heading}</h3>
                            <p>{renderInline(section.body)}</p>
                        </section>
                    ))}
                </div>

                <div className="how-to-play-footer">
                    <span>ShuffleUp · Game Manual</span>
                    <button type="button" className="how-to-play-back" onClick={onClose}>
                        Back to Games
                    </button>
                </div>
            </section>
        </div>
    );
}

export default HowToPlayModal;
