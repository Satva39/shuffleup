import { Text, View } from "react-native";
import { colors } from "../theme";

export default function BrandMark({ compact = false }) {
  return (
    <View style={{ alignItems: compact ? "flex-start" : "center" }}>
      <Text
        style={{
          color: colors.text,
          fontSize: compact ? 22 : 34,
          fontWeight: "900",
          letterSpacing: -1.5,
        }}
      >
        Shuffle<Text style={{ color: colors.primary }}>Up</Text>
      </Text>
      {!compact && (
        <Text
          style={{
            color: colors.muted,
            fontSize: 12,
            marginTop: 2,
            letterSpacing: 2,
          }}
        >
          PLAY TOGETHER
        </Text>
      )}
    </View>
  );
}
