import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../../services/socket";
import "./gameExperience.css";

function readVoiceSettings() {
  try {
    return {
      enabled: localStorage.getItem("shuffleup_bot_voice") === "1",
      volume: Math.max(0, Math.min(1, Number(localStorage.getItem("shuffleup_bot_voice_volume") || 0.7))),
      voiceURI: localStorage.getItem("shuffleup_bot_voice_uri") || "",
    };
  } catch {
    return { enabled: false, volume: 0.7, voiceURI: "" };
  }
}

function formatTime(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function DemoSessionBridge() {
  const location = useLocation();
  const navigate = useNavigate();
  const [expiresAt, setExpiresAt] = useState(() => Number(localStorage.getItem("shuffleup_demo_expires_at") || 0));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const refresh = () => {
      setExpiresAt(Number(localStorage.getItem("shuffleup_demo_expires_at") || 0));
      setNow(Date.now());
    };
    const onExpired = () => {
      localStorage.removeItem("shuffleup_demo_token");
      localStorage.removeItem("shuffleup_demo_expires_at");
      setExpiresAt(0);
      socket.disconnect();
      navigate("/login?demoExpired=1", { replace: true });
    };
    window.addEventListener("shuffleup-demo-started", refresh);
    socket.on("demo-expired", onExpired);
    const timer = window.setInterval(refresh, 1000);
    return () => {
      window.removeEventListener("shuffleup-demo-started", refresh);
      socket.off("demo-expired", onExpired);
      window.clearInterval(timer);
    };
  }, [navigate]);

  useEffect(() => {
    if (!expiresAt || !localStorage.getItem("shuffleup_demo_token") || expiresAt > now) return;
    localStorage.removeItem("shuffleup_demo_token");
    localStorage.removeItem("shuffleup_demo_expires_at");
    socket.disconnect();
    navigate("/login?demoExpired=1", { replace: true });
  }, [expiresAt, now, navigate]);

  const activeToken = Boolean(localStorage.getItem("shuffleup_demo_token")) && expiresAt > now;
  if (!activeToken) return null;
  const remaining = Math.ceil((expiresAt - now) / 1000);
  return (
    <aside className="shuffleup-demo-banner" role="status">
      <span className="shuffleup-demo-pulse" aria-hidden="true" />
      <strong>2-minute demo</strong>
      <span>{formatTime(remaining)} remaining</span>
      <span className="shuffleup-demo-separator">·</span>
      <span>Bot games only</span>
      <button type="button" onClick={() => navigate(`/register?redirect=${encodeURIComponent(location.pathname + location.search)}`)}>Create account</button>
      <button type="button" className="shuffleup-demo-login" onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`)}>Sign in</button>
    </aside>
  );
}

export default function GameExperienceBridge() {
  const location = useLocation();
  const [effect, setEffect] = useState(null);
  const [reaction, setReaction] = useState(null);
  const [voiceSettings, setVoiceSettings] = useState(readVoiceSettings);
  const inGame = /^\/games\//.test(location.pathname);

  useEffect(() => {
    const onSettings = (event) => setVoiceSettings({ ...readVoiceSettings(), ...(event.detail || {}) });
    window.addEventListener("shuffleup-bot-voice-settings", onSettings);
    return () => window.removeEventListener("shuffleup-bot-voice-settings", onSettings);
  }, []);

  useEffect(() => {
    if (!inGame) {
      setEffect(null);
      setReaction(null);
      return undefined;
    }
    let effectTimer = null;
    let reactionTimer = null;
    const onReaction = (payload) => {
      if (!payload?.text || !payload?.botName) return;
      setReaction({ text: String(payload.text).slice(0, 180), name: String(payload.botName).slice(0, 40), persona: payload.persona === "female" ? "female" : "male" });
      if (reactionTimer) window.clearTimeout(reactionTimer);
      reactionTimer = window.setTimeout(() => setReaction(null), 6200);
      const settings = readVoiceSettings();
      if (settings.enabled && typeof window !== "undefined" && window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined") {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(String(payload.text).slice(0, 180));
          utterance.volume = settings.volume;
          utterance.rate = 0.96;
          const availableVoices = window.speechSynthesis.getVoices().filter((voice) => !voice.lang || /^en([_-]|$)/i.test(voice.lang));
          const selectedVoice = availableVoices.find((voice) => voice.voiceURI === settings.voiceURI);
          const voicePattern = reaction.persona === "female"
            ? /(female|woman|samantha|victoria|ava|jenny|susan|aria|zira|karen|tessa|serena)/i
            : /(male|man|david|mark|daniel|guy|alex|james|george|fred)/i;
          utterance.voice = selectedVoice || availableVoices.find((voice) => voicePattern.test(`${voice.name} ${voice.voiceURI}`)) || null;
          window.speechSynthesis.speak(utterance);
        } catch { /* speech is an optional enhancement; never block play */ }
      }
    };
    const onAny = (eventName, payload) => {
      if (String(eventName).endsWith("bot-reaction")) { onReaction(payload); return; }
      const event = String(eventName || "").toLowerCase();
      let kind = null;
      let label = "";
      if (event.includes("game-start") || event.includes("round-start") || event.includes("deal")) { kind = "deal"; label = "Dealer is dealing"; }
      else if (event.includes("card-played") || event.endsWith(":play-card") || event.includes(":discard")) { kind = "play"; label = "Card to the table"; }
      else if (event.includes("trick-complete") || event.includes("trick-won") || event.includes("pile-transfer")) { kind = "collect"; label = "Collecting the cards"; }
      else if (event.includes("game-complete")) { kind = "result"; label = "Round complete"; }
      if (!kind) return;
      setEffect({ kind, label, id: `${Date.now()}-${event}` });
      if (effectTimer) window.clearTimeout(effectTimer);
      effectTimer = window.setTimeout(() => setEffect(null), kind === "result" ? 2300 : 1050);
    };
    socket.onAny(onAny);
    return () => {
      socket.offAny(onAny);
      if (effectTimer) window.clearTimeout(effectTimer);
      if (reactionTimer) window.clearTimeout(reactionTimer);
    };
  }, [inGame]);

  if (!inGame || (!effect && !reaction)) return null;
  return (
    <div className="shuffleup-game-experience" aria-live="polite">
      {effect && <div key={effect.id} className={`shuffleup-dealer-effect shuffleup-dealer-effect--${effect.kind}`}>
        <span className="shuffleup-dealer-avatar" aria-hidden="true">♟</span>
        <span className="shuffleup-dealer-title">Dealer</span>
        <span className="shuffleup-dealer-cards" aria-hidden="true"><i>🂠</i><i>🂠</i><i>🂠</i></span>
        <strong>{effect.label}</strong>
      </div>}
      {reaction && <div className="shuffleup-bot-reaction" key={`${reaction.name}:${reaction.text}`}>
        <span className={`shuffleup-bot-avatar shuffleup-bot-avatar--${reaction.persona}`} aria-hidden="true">{reaction.persona === "female" ? "M" : "A"}</span>
        <div><strong>{reaction.name}</strong><p>{reaction.text}</p></div>
      </div>}
    </div>
  );
}
