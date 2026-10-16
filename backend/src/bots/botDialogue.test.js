import assert from "node:assert/strict";
import { fallbackBotReaction, generateBotReaction } from "./botDialogue.js";

const oldEnv = {
  enabled: process.env.BOT_LLM_ENABLED,
  url: process.env.BOT_LLM_BASE_URL,
  model: process.env.BOT_LLM_MODEL,
  key: process.env.BOT_LLM_API_KEY,
};
const originalFetch = globalThis.fetch;
try {
  process.env.BOT_LLM_ENABLED = "false";
  assert.match(fallbackBotReaction({ gameId: "uno", botName: "Arjun", persona: "male", actionEvent: "uno:play-card" }), /^Arjun: /);
  assert.match(fallbackBotReaction({ gameId: "uno", botName: "Maya", persona: "female", actionEvent: "uno:draw" }), /^Maya: /);
  const fallback = await generateBotReaction({ gameId: "war", botName: "Maya", persona: "female", actionEvent: "war:play-card" });
  assert.match(fallback, /^Maya: /);

  process.env.BOT_LLM_ENABLED = "true";
  process.env.BOT_LLM_BASE_URL = "http://127.0.0.1:11434";
  process.env.BOT_LLM_MODEL = "test-open-model";
  process.env.BOT_LLM_API_KEY = "local-test-key";
  let requestUrl = "";
  let requestBody = null;
  globalThis.fetch = async (url, options) => {
    requestUrl = String(url);
    requestBody = JSON.parse(options.body);
    assert.equal(options.headers.Authorization, "Bearer local-test-key");
    return { ok: true, json: async () => ({ choices: [{ message: { content: "Nice move. This round is getting interesting." } }] }) };
  };
  const llmResult = await generateBotReaction({
    gameId: "uno", botName: "Maya", persona: "female", actionEvent: "uno:play-card",
    playerName: "Alice", publicEvent: { publicCard: { rank: "7", suit: "hearts" }, phase: "play" },
  });
  assert.equal(requestUrl, "http://127.0.0.1:11434/v1/chat/completions");
  assert.match(requestBody.messages[0].content, /Do not reveal.*hidden cards/i);
  assert.equal(llmResult, "Nice move. This round is getting interesting.");
  globalThis.fetch = async () => { throw new Error("provider offline"); };
  assert.match(await generateBotReaction({ gameId: "uno", botName: "Arjun", persona: "male", actionEvent: "uno:play-card" }), /^Arjun: /);
  console.log("✓ Bot persona fallback, OpenAI-compatible adapter and provider-failure tests passed");
} finally {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries({ BOT_LLM_ENABLED: oldEnv.enabled, BOT_LLM_BASE_URL: oldEnv.url, BOT_LLM_MODEL: oldEnv.model, BOT_LLM_API_KEY: oldEnv.key })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}
