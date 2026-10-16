const FALLBACK_LINES = Object.freeze({
  male: {
    play: ["Nice move. Let’s see what you do next.", "Good one. I’m keeping an eye on the table.", "That changes things a little.", "Alright, my turn to think."],
    draw: ["Picking up a card can change the round.", "Let’s see whether that helps your hand."],
    win: ["That was a close one.", "Well played. I’m ready for the next round."],
    general: ["Interesting move.", "I see what you’re trying to do.", "The table is getting interesting."],
  },
  female: {
    play: ["Ooh, clever move!", "Okay, I wasn’t expecting that one.", "Nice play. Let’s keep this interesting.", "Your turn made things spicy."],
    draw: ["Maybe the next card will be the one.", "A fresh card can open up options."],
    win: ["That was fun. Rematch?", "Good game. Let’s go again."],
    general: ["I’m curious what you’ll try next.", "That’s an interesting choice.", "You’ve got my attention."],
  },
  neutral: {
    play: ["Good move.", "Interesting play.", "Let’s see how this develops."],
    draw: ["A new card, a new possibility.", "Let’s see what comes next."],
    win: ["Good game.", "That was a solid round."],
    general: ["Interesting.", "Let’s keep going.", "I’m watching the table."],
  },
});

const lastFallbackIndex = new Map();
const MAX_CONTEXT_LENGTH = 450;

function categoryFor(eventName) {
  const event = String(eventName || "").toLowerCase();
  if (/complete|winner|win/.test(event)) return "win";
  if (/draw/.test(event)) return "draw";
  if (/play|discard|action|claim|challenge|bid|move|turn|pass/.test(event)) return "play";
  return "general";
}

function truncate(value, max) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

export function fallbackBotReaction({ gameId, botName, persona = "neutral", actionEvent }) {
  const resolvedPersona = FALLBACK_LINES[persona] ? persona : "neutral";
  const category = categoryFor(actionEvent);
  const lines = FALLBACK_LINES[resolvedPersona][category] || FALLBACK_LINES[resolvedPersona].general;
  const key = `${resolvedPersona}:${gameId}:${category}`;
  const prior = lastFallbackIndex.get(key) ?? -1;
  const next = (prior + 1) % lines.length;
  lastFallbackIndex.set(key, next);
  const prefix = botName ? `${truncate(botName, 30)}: ` : "";
  return `${prefix}${lines[next]}`;
}

/** Optional OpenAI-compatible adapter for Ollama, vLLM, LocalAI, or a compatible open model server. */
export async function generateBotReaction({ gameId, botName, persona = "neutral", actionEvent, playerName, publicEvent = {} }) {
  const fallback = fallbackBotReaction({ gameId, botName, persona, actionEvent });
  const baseUrl = String(process.env.BOT_LLM_BASE_URL || "").trim().replace(/\/$/, "");
  const model = String(process.env.BOT_LLM_MODEL || "").trim();
  if (!baseUrl || !model || process.env.BOT_LLM_ENABLED !== "true") return fallback;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(2500, Math.max(300, Number(process.env.BOT_LLM_TIMEOUT_MS || 1800))));
  timeout.unref?.();
  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.BOT_LLM_API_KEY ? { Authorization: `Bearer ${process.env.BOT_LLM_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        max_tokens: 45,
        messages: [
          { role: "system", content: `You are ${truncate(botName || "a ShuffleUp opponent", 40)}, a ${persona} card-game bot. Give one natural, friendly reaction of at most 16 words to the latest PUBLIC action in ${truncate(gameId, 30)}. Do not reveal or imply hidden cards, private state, probability calculations, or secret strategy. No insults, no repeated emoji, no narration of rules. Return only the spoken reaction.` },
          { role: "user", content: JSON.stringify({ action: truncate(actionEvent, 80), player: truncate(playerName || "a player", 30), publicContext: truncate(JSON.stringify(publicEvent), MAX_CONTEXT_LENGTH) }) },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) return fallback;
    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content;
    if (typeof text !== "string") return fallback;
    const cleaned = truncate(text.replace(/^\s*["']|["']\s*$/g, ""), 180);
    return cleaned && cleaned.split(/\s+/).length <= 20 ? cleaned : fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}
