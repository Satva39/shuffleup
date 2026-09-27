import { Text, View } from "react-native";
import { colors, radii } from "../../../theme";

export default function BluffHistory({ history = [] }) {
  const recent = [...history].reverse().slice(0, 5);
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
      }}
    >
      <Text
        style={{
          color: colors.cyan,
          fontSize: 11,
          fontWeight: "900",
          letterSpacing: 1.5,
        }}
      >
        RECENT CLAIMS
      </Text>
      {recent.length === 0 ? (
        <Text style={{ color: colors.muted, marginTop: 12 }}>
          Claims will appear here.
        </Text>
      ) : (
        recent.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}
                numberOfLines={1}
              >
                {item.playerName}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                {item.count} × {item.rank}
              </Text>
            </View>
            {item.result ? (
              <Text
                style={{
                  color: item.result === "BLUFF" ? colors.red : colors.green,
                  fontSize: 10,
                  fontWeight: "900",
                }}
              >
                {item.result}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}
