const colors = ["red", "yellow", "green", "blue"];

function ColorPicker({ open, onChoose }) {
    if (!open) return null;
    return (
        <div className="uno-modal-backdrop">
            <div className="uno-color-modal">
                <span>WILD CARD</span>
                <h2>CHOOSE COLOR</h2>
                <div className="uno-color-grid">
                    {colors.map((color) => (
                        <button key={color} className={`uno-color-button uno-color-${color}`} onClick={() => onChoose(color)}>
                            {color}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ColorPicker;
