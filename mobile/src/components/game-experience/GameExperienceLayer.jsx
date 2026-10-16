import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { shuffleSocket } from "../../services/socket";
import { colors, radii } from "../../theme";

const PREFS_KEY = "shuffleup:game-audio-preferences";
const defaultPrefs = {
  sound: false,
  music: false,
  voice: false,
  voiceMode: "character",
  voiceVolume: 0.75,
  soundVolume: 0.55,
  voiceIdentifier: "",
};

async function readPrefs() {
  // Audio settings are device preferences, not account data.
  try {
    const raw = await SecureStore.getItemAsync(PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...defaultPrefs,
      ...parsed,
      voiceVolume: Math.max(
        0,
        Math.min(1, Number(parsed.voiceVolume ?? defaultPrefs.voiceVolume)),
      ),
      soundVolume: Math.max(
        0,
        Math.min(1, Number(parsed.soundVolume ?? defaultPrefs.soundVolume)),
      ),
      voiceMode: ["character", "male", "female"].includes(parsed.voiceMode)
        ? parsed.voiceMode
        : "character",
      voiceIdentifier: String(parsed.voiceIdentifier || "").slice(0, 200),
    };
  } catch {
    return { ...defaultPrefs };
  }
}

function formatReaction(payload) {
  if (!payload?.text) return null;
  return {
    name: String(payload.botName || "ShuffleUp Bot").slice(0, 40),
    persona: payload.persona === "female" ? "female" : "male",
    text: String(payload.text).slice(0, 180),
  };
}

export default function GameExperienceLayer({ active = false }) {
  const cardPlayer = useAudioPlayer(
    require("../../../assets/audio/card-flick.wav"),
  );
  const musicPlayer = useAudioPlayer(
    require("../../../assets/audio/ambient-table.wav"),
  );
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [effect, setEffect] = useState(null);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const reactionTimer = useRef(null);
  const effectTimer = useRef(null);
  const speakingRef = useRef(false);
  const lastSpeakAtRef = useRef(0);
  const effectProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    readPrefs().then((next) => {
      if (active) {
        setPrefs(next);
        setSelectedVoice(next.voiceIdentifier || "");
        setPrefsLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!active) {
      setReaction(null);
      setEffect(null);
      return undefined;
    }
    const listener = (eventName, payload) => {
      const event = String(eventName || "").toLowerCase();
      if (event === "bot-reaction") {
        const next = formatReaction(payload);
        if (!next) return;
        setReaction(next);
        if (reactionTimer.current) clearTimeout(reactionTimer.current);
        reactionTimer.current = setTimeout(() => setReaction(null), 6500);
        const now = Date.now();
        if (
          prefs.voice &&
          !speakingRef.current &&
          now - lastSpeakAtRef.current > 3500
        ) {
          speakingRef.current = true;
          lastSpeakAtRef.current = now;
          try {
            Speech.stop();
            const characterPitch = next.persona === "female" ? 1.12 : 0.88;
            const requestedPitch =
              prefs.voiceMode === "female"
                ? 1.12
                : prefs.voiceMode === "male"
                  ? 0.88
                  : characterPitch;
            const genderPattern =
              prefs.voiceMode === "female" ||
              (prefs.voiceMode === "character" && next.persona === "female")
                ? /(female|woman|samantha|victoria|ava|jenny|susan|aria|zira|karen|tessa|serena)/i
                : /(male|man|david|mark|daniel|guy|alex|james|george|fred)/i;
            const automaticVoice = voices.find((voice) =>
              genderPattern.test(`${voice.name} ${voice.identifier}`),
            );
            const explicitVoice = voices.find(
              (voice) => voice.identifier === selectedVoice,
            );
            Speech.speak(next.text, {
              language: "en-US",
              pitch: requestedPitch,
              rate: 0.94,
              volume: Math.max(0, Math.min(1, Number(prefs.voiceVolume) || 0)),
              ...(explicitVoice || automaticVoice
                ? { voice: (explicitVoice || automaticVoice).identifier }
                : {}),
              onDone: () => {
                speakingRef.current = false;
              },
              onStopped: () => {
                speakingRef.current = false;
              },
              onError: () => {
                speakingRef.current = false;
              },
            });
          } catch {
            speakingRef.current = false;
          }
        }
        return;
      }
      let visual = null;
      if (event.includes("game-complete"))
        visual = { kind: "result", label: "Game complete", duration: 2200 };
      else if (
        event.includes("trick-complete") ||
        event.includes("trick-won") ||
        event.includes("pile-transfer") ||
        event.includes("score-update") ||
        event.includes("score-updated")
      )
        visual = { kind: "collect", label: "Collecting cards", duration: 1100 };
      else if (
        event.includes("card-played") ||
        event.endsWith(":play-card") ||
        event.includes(":discard") ||
        event.endsWith(":draw")
      )
        visual = {
          kind: event.endsWith(":draw") ? "draw" : "play",
          label: event.endsWith(":draw") ? "Card drawn" : "Card played",
          duration: 900,
        };
      else if (
        event.includes("game-start") ||
        event.includes("round-start") ||
        event.includes(":deal") ||
        event.includes("battle-start")
      )
        visual = { kind: "deal", label: "Dealer is dealing", duration: 1200 };
      if (visual) {
        setEffect({ key: `${Date.now()}-${event}`, ...visual });
        if (effectTimer.current) clearTimeout(effectTimer.current);
        effectTimer.current = setTimeout(
          () => setEffect(null),
          visual.duration,
        );
        if (prefs.sound && visual.kind !== "result") {
          try {
            cardPlayer.volume = Math.max(
              0,
              Math.min(1, Number(prefs.soundVolume) || 0),
            );
            void cardPlayer.seekTo(0).then(() => cardPlayer.play());
          } catch {
            /* audio must never affect moves */
          }
        }
      }
    };
    const unsubscribe = shuffleSocket.onAny(listener);
    return () => {
      unsubscribe?.();
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      if (effectTimer.current) clearTimeout(effectTimer.current);
    };
  }, [active, prefs, selectedVoice, cardPlayer]);

  useEffect(() => {
    try {
      musicPlayer.loop = true;
      musicPlayer.volume = 0.07;
      if (active && prefs.music) musicPlayer.play();
      else musicPlayer.pause();
    } catch {
      /* audio support depends on OS/user settings */
    }
    return () => {
      try {
        musicPlayer.pause();
      } catch {}
    };
  }, [active, prefs.music, musicPlayer]);

  useEffect(() => {
    let stillActive = true;
    Speech.getAvailableVoicesAsync()
      .then((result) => {
        if (stillActive)
          setVoices(
            Array.isArray(result)
              ? result.filter(
                  (voice) =>
                    !voice.language ||
                    String(voice.language).toLowerCase().startsWith("en"),
                )
              : [],
          );
      })
      .catch(() => {});
    return () => {
      stillActive = false;
    };
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(prefs)).catch(() => {
      /* preferences are optional */
    });
  }, [prefs, prefsLoaded]);

  useEffect(() => {
    if (!effect) {
      effectProgress.setValue(0);
      return undefined;
    }
    effectProgress.setValue(0);
    const animation = Animated.spring(effectProgress, {
      toValue: 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 190,
      mass: 0.7,
    });
    animation.start();
    return () => animation.stop();
  }, [effect?.key, effectProgress]);

  if (!active) return null;
  const update = (patch) => setPrefs((current) => ({ ...current, ...patch }));
  const selectedVoiceName =
    voices.find((voice) => voice.identifier === selectedVoice)?.name || "Auto";
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 5,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 8000,
      }}
    >
      <Pressable
        onPress={() => setShowAudioSettings((value) => !value)}
        style={{
          position: "absolute",
          right: 12,
          top: 4,
          minWidth: 42,
          height: 38,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: "rgba(11,17,34,0.95)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 9,
        }}
        accessibilityRole="button"
        accessibilityLabel="Audio and bot voice settings"
      >
        <Ionicons name="musical-notes-outline" size={18} color={colors.cyan} />
      </Pressable>
      {showAudioSettings ? (
        <View
          style={{
            position: "absolute",
            right: 10,
            top: 48,
            width: 252,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: radii.lg,
            padding: 12,
            gap: 9,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 16,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}>
            Game experience
          </Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[
              { key: "sound", label: "SFX" },
              { key: "music", label: "Music" },
              { key: "voice", label: "Bot voice" },
            ].map((item) => (
              <Pressable
                key={item.key}
                onPress={() => update({ [item.key]: !prefs[item.key] })}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: prefs[item.key]
                    ? colors.cyan
                    : colors.surface2,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: prefs[item.key] ? "#07111f" : colors.text,
                    fontSize: 11,
                    fontWeight: "900",
                  }}
                >
                  {item.label} {prefs[item.key] ? "On" : "Off"}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: colors.muted, fontSize: 11 }}>
            Voice style:{" "}
            {prefs.voiceMode === "character"
              ? "Match character"
              : prefs.voiceMode === "female"
                ? "Higher pitch"
                : "Lower pitch"}
          </Text>
          <View style={{ flexDirection: "row", gap: 5 }}>
            {[
              { value: "character", title: "Auto" },
              { value: "male", title: "Lower" },
              { value: "female", title: "Higher" },
            ].map((mode) => (
              <Pressable
                key={mode.value}
                onPress={() => update({ voiceMode: mode.value })}
                style={{
                  flex: 1,
                  borderRadius: 7,
                  paddingVertical: 6,
                  alignItems: "center",
                  backgroundColor:
                    prefs.voiceMode === mode.value
                      ? "#155e75"
                      : colors.surface2,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 10,
                    fontWeight: "800",
                  }}
                >
                  {mode.title}
                </Text>
              </Pressable>
            ))}
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              Speech volume
            </Text>
            <Pressable
              onPress={() =>
                update({
                  voiceVolume: Math.max(
                    0,
                    Math.min(
                      1,
                      Math.round((Number(prefs.voiceVolume) - 0.1) * 10) / 10,
                    ),
                  ),
                })
              }
            >
              <Text
                style={{ color: colors.cyan, fontSize: 18, fontWeight: "900" }}
              >
                −
              </Text>
            </Pressable>
            <Text style={{ color: colors.text, fontWeight: "800" }}>
              {Math.round(prefs.voiceVolume * 100)}%
            </Text>
            <Pressable
              onPress={() =>
                update({
                  voiceVolume: Math.max(
                    0,
                    Math.min(
                      1,
                      Math.round((Number(prefs.voiceVolume) + 0.1) * 10) / 10,
                    ),
                  ),
                })
              }
            >
              <Text
                style={{ color: colors.cyan, fontSize: 18, fontWeight: "900" }}
              >
                +
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={async () => {
              try {
                let available = voices;
                if (!available.length) {
                  const found = await Speech.getAvailableVoicesAsync();
                  available = Array.isArray(found)
                    ? found.filter(
                        (voice) =>
                          !voice.language ||
                          String(voice.language).toLowerCase().startsWith("en"),
                      )
                    : [];
                  setVoices(available);
                }
                const index = available.findIndex(
                  (voice) => voice.identifier === selectedVoice,
                );
                const next = available.length
                  ? available[(index + 1 + available.length) % available.length]
                  : null;
                if (next) {
                  setSelectedVoice(next.identifier);
                  update({ voiceIdentifier: next.identifier });
                }
              } catch {}
            }}
          >
            <Text
              style={{ color: colors.cyan, fontSize: 11, fontWeight: "800" }}
            >
              Voice: {selectedVoiceName} · Change
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowAudioSettings(false)}
            style={{ alignSelf: "flex-end", padding: 4 }}
          >
            <Text
              style={{ color: colors.muted, fontSize: 11, fontWeight: "800" }}
            >
              Close
            </Text>
          </Pressable>
        </View>
      ) : null}
      {effect ? (
        <Animated.View
          key={effect.key}
          style={{
            position: "absolute",
            top: 54,
            left: 15,
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 11,
            paddingVertical: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: effect.kind === "result" ? "#d8b4fe" : colors.border,
            backgroundColor: "rgba(11,17,34,0.94)",
            opacity: effectProgress,
            transform: [
              {
                translateY: effectProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              },
              {
                scale: effectProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
                }),
              },
            ],
          }}
        >
          <Text
            style={{
              color: effect.kind === "result" ? "#d8b4fe" : colors.cyan,
              fontSize: 18,
            }}
          >
            {effect.kind === "result" ? "✦" : "♟"}
          </Text>
          <Text style={{ color: colors.text, fontSize: 11, fontWeight: "900" }}>
            {effect.kind === "result" ? "Table" : "Dealer"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>
            {effect.label}
          </Text>
          <Text style={{ color: colors.cyan, fontSize: 18 }}>
            {effect.kind === "collect" ? "⬅ 🂠" : "🂠🂠"}
          </Text>
        </Animated.View>
      ) : null}
      {reaction ? (
        <View
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 94,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
            padding: 12,
            borderRadius: 15,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: "rgba(11,17,34,0.97)",
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor:
                reaction.persona === "female" ? "#701a75" : "#164e63",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#f8fafc", fontWeight: "900" }}>
              {reaction.persona === "female" ? "M" : "A"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: colors.cyan, fontWeight: "900", fontSize: 12 }}
            >
              {reaction.name}
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: 13,
                lineHeight: 19,
                marginTop: 3,
              }}
            >
              {reaction.text}
            </Text>
          </View>
          <Pressable onPress={() => setReaction(null)} hitSlop={8}>
            <Ionicons name="close" color={colors.muted} size={18} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
