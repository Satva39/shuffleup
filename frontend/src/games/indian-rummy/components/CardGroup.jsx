export default function CardGroup({ selectedCount }) {
    return <div className="rummy-group-helper">{selectedCount ? `${selectedCount} selected — use Move Left/Right to arrange` : "Select cards to arrange your hand"}</div>;
}
