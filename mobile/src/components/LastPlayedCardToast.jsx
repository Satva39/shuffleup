import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { shuffleSocket } from "../services/socket";
import { colors, radii } from "../theme";

const EVENT_NAMES = [
  "kachuful:card-played",
  "teen-patti:card-played",
  "indian-rummy:discard",
  "mangoose:card-flipped",
  "uno:card-played",
  "jack-thief:card-played",
  "napoleon:card-played",
  "bridge:card-played",
  "spades:card-played",
  "twenty-nine:card-played",
  "mindi-coat:card-played",
  "bluff:card-played",
  "satte-pe-satta:card-played",
  "war:card-played",
];
const SUIT_SYMBOLS = { H: "♥", hearts: "♥", D: "♦", diamonds: "♦", S: "♠", spades: "♠", C: "♣", clubs: "♣" };

function describeCard(payload) {
  const card = payload?.card || payload?.discard || payload?.result?.card || null;
  if (!card) return "Played a card";
  if (card.type === "number") return `${card.color || ""} ${card.value}`.trim();
  if (card.color && card.type) return `${card.color} ${card.value || card.type}`;
  const rank = card.rank ?? card.value ?? card.label ?? card.name;
  const suit = SUIT_SYMBOLS[card.suit] || card.suit || "";
  const id = typeof card.id === "string" ? card.id : "";
  if (rank != null) return `${rank}${suit ? ` ${suit}` : ""}`;
  if (id) return id;
  return "Played a card";
}

export default function LastPlayedCardToast() {
  const [lastPlay, setLastPlay] = useState(null);

  useEffect(() => {
    const unsubscribers = EVENT_NAMES.map((eventName) => shuffleSocket.on(eventName, (payload = {}) => {
      const name = typeof payload.playerName === "string" && payload.playerName.trim()
        ? payload.playerName.trim()
        : "A player";
      setLastPlay({ id: `${eventName}:${Date.now()}`, name, card: describeCard(payload), eventName });
    }));
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  if (!lastPlay) return null;
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top: 10, left: 12, right: 12, alignItems: "center", zIndex: 1000, elevation: 20 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Dismiss last play. ${lastPlay.name} played ${lastPlay.card}`}
        onPress={() => setLastPlay(null)}
        style={{ width: "100%", maxWidth: 440, paddingHorizontal: 15, paddingVertical: 12, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.primary, backgroundColor: "#141B35", flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } }}
      >
        <View style={{ width: 42, height: 54, borderRadius: 7, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#D4D9E5" }}>
          <Text numberOfLines={1} style={{ color: /[♥♦]/.test(lastPlay.card) ? "#CF3347" : "#171C2F", fontWeight: "900", fontSize: 12, textAlign: "center" }}>{lastPlay.card}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.cyan, textTransform: "uppercase", fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>Last card played</Text>
          <Text numberOfLines={1} style={{ color: colors.text, fontSize: 15, fontWeight: "900", marginTop: 3 }}>{lastPlay.name}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{lastPlay.card}</Text>
        </View>
        <Text style={{ color: colors.muted, fontWeight: "900", fontSize: 20 }}>×</Text>
      </Pressable>
    </View>
  );
}
