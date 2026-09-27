import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../../../theme";

export default function BidPanel({
  maxBid,
  selectedBid,
  submitted,
  myTurn,
  onSelect,
  onConfirm,
}) {
  const values = Array.from({ length: maxBid + 1 }, (_, index) => index);

  return (
    <View style={styles.panel}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.kicker}>YOUR BID</Text>
          <Text style={styles.title}>
            {submitted
              ? "Bid submitted"
              : myTurn
                ? "How many tricks will you take?"
                : "Choose once it is your turn"}
          </Text>
        </View>
        {submitted ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.green} />
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.choices}
      >
        {values.map((value) => {
          const active = selectedBid === value;
          return (
            <Pressable
              key={value}
              disabled={submitted || !myTurn}
              onPress={() => onSelect(value)}
              style={({ pressed }) => [
                styles.choice,
                active && styles.choiceActive,
                !myTurn && !submitted && styles.choiceDisabled,
                pressed && styles.choicePressed,
              ]}
            >
              <Text
                style={[styles.choiceValue, active && styles.choiceValueActive]}
              >
                {value}
              </Text>
              <Text
                style={[styles.choiceLabel, active && styles.choiceValueActive]}
              >
                {value === 1 ? "TRICK" : "TRICKS"}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        disabled={submitted || !myTurn || selectedBid === null}
        onPress={onConfirm}
        style={({ pressed }) => [
          styles.confirm,
          (submitted || !myTurn || selectedBid === null) &&
            styles.confirmDisabled,
          pressed && styles.confirmPressed,
        ]}
      >
        <Ionicons
          name={submitted ? "checkmark" : "send"}
          size={17}
          color="#08101E"
        />
        <Text style={styles.confirmText}>
          {submitted ? "BID SUBMITTED" : "CONFIRM BID"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  kicker: {
    color: colors.primary,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: { color: colors.text, fontSize: 13, fontWeight: "800", marginTop: 4 },
  choices: { gap: 7, marginTop: 12 },
  choice: {
    width: 64,
    minHeight: 54,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(124,92,255,0.18)",
  },
  choiceDisabled: { opacity: 0.42 },
  choicePressed: { opacity: 0.82 },
  choiceValue: { color: colors.text, fontSize: 18, fontWeight: "900" },
  choiceValueActive: { color: colors.white },
  choiceLabel: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: "900",
    marginTop: 1,
  },
  confirm: {
    minHeight: 50,
    marginTop: 10,
    borderRadius: radii.md,
    backgroundColor: colors.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmDisabled: { opacity: 0.42 },
  confirmPressed: { opacity: 0.84 },
  confirmText: {
    color: "#08101E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
});
