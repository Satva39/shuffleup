import { isBotPlayer } from "../utils/player";

export default function BotBadge({ player }) {
  return isBotPlayer(player) ? (
    <span className="shuffleup-bot-badge">BOT</span>
  ) : null;
}
