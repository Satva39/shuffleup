import { AccessibilityInfo, Animated, Easing, StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 190;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checker = AccessibilityInfo.isReduceMotionEnabled;
    if (typeof checker === "function") {
      checker()
        .then((enabled) => {
          if (mounted) setReduced(Boolean(enabled));
        })
        .catch(() => {});
    }

    const subscription = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      setReduced,
    );

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}

function useEntranceAnimation(
  motionKey,
  { distance = 10, scale = 0.96, duration = DEFAULT_DURATION } = {},
) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduced ? 0 : distance)).current;
  const scaleValue = useRef(new Animated.Value(reduced ? 1 : scale)).current;

  useEffect(() => {
    opacity.stopAnimation();
    translateY.stopAnimation();
    scaleValue.stopAnimation();

    if (reduced || motionKey == null) {
      opacity.setValue(1);
      translateY.setValue(0);
      scaleValue.setValue(1);
      return undefined;
    }

    opacity.setValue(0);
    translateY.setValue(distance);
    scaleValue.setValue(scale);

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        speed: 22,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [
    distance,
    duration,
    motionKey,
    opacity,
    reduced,
    scale,
    scaleValue,
    translateY,
  ]);

  return {
    opacity,
    transform: [{ translateY }, { scale: scaleValue }],
    reduced,
  };
}

export function cardMotionKey(props = {}) {
  const card = props.card;
  if (card?.id !== undefined && card?.id !== null) {
    return `card:${card.id}`;
  }

  if (card) {
    const identity = [
      card.suit,
      card.rank,
      card.value,
      card.type,
      card.color,
      card.symbol,
    ]
      .filter((part) => part !== undefined && part !== null)
      .join(":");
    if (identity) return `card:${identity}`;
  }

  if (props.hidden || props.faceDown) return "card:back";
  if (props.featured)
    return `card:featured:${props.compact ? "compact" : "full"}`;
  return "card:static";
}

export function seatMotionKey(props = {}) {
  const player = props.player || {};
  const id = player.id ?? player.username ?? "seat";
  const status = player.status ?? player.connectionStatus ?? "";
  return `seat:${id}:${status}`;
}

export function GameCardMotion({
  children,
  motionKey,
  emphasize = false,
  style,
}) {
  const motion = useEntranceAnimation(motionKey ?? "card:mount", {
    distance: 9,
    scale: 0.965,
    duration: 185,
  });

  const { reduced } = motion;
  const emphasisScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    emphasisScale.stopAnimation();
    if (reduced || !emphasize) {
      emphasisScale.setValue(1);
      return undefined;
    }

    const animation = Animated.sequence([
      Animated.spring(emphasisScale, {
        toValue: 1.045,
        speed: 24,
        bounciness: 5,
        useNativeDriver: true,
      }),
      Animated.timing(emphasisScale, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [emphasize, emphasisScale, motionKey, reduced]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.cardMotion,
        motion,
        { transform: [...motion.transform, { scale: emphasisScale }] },
        style,
      ]}
    >
      {children}
      {emphasize ? (
        <Animated.View pointerEvents="none" style={styles.cardHighlight} />
      ) : null}
    </Animated.View>
  );
}

export function GameSeatMotion({ children, motionKey, active = false, style }) {
  const motion = useEntranceAnimation(motionKey ?? "seat:mount", {
    distance: 7,
    scale: 0.98,
    duration: 170,
  });
  const activeScale = useRef(new Animated.Value(active ? 1.015 : 1)).current;
  const valueScale = useRef(new Animated.Value(1)).current;
  const previousValueKey = useRef(null);
  const { reduced } = motion;
  const playerValueKey = (() => {
    const player = children?.props?.player || {};
    return [
      player.score,
      player.totalScore,
      player.roundScore,
      player.points,
      player.tricksWon,
      player.cardsRemaining,
      player.bid,
    ]
      .map((value) =>
        value === undefined || value === null ? "" : String(value),
      )
      .join("|");
  })();

  useEffect(() => {
    activeScale.stopAnimation();
    if (reduced) {
      activeScale.setValue(1);
      return undefined;
    }

    const animation = Animated.spring(activeScale, {
      toValue: active ? 1.015 : 1,
      speed: 22,
      bounciness: 3,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [active, activeScale, reduced]);

  useEffect(() => {
    const isFirstValue = previousValueKey.current === null;
    previousValueKey.current = playerValueKey;
    valueScale.stopAnimation();

    if (reduced || isFirstValue || !playerValueKey) {
      valueScale.setValue(1);
      return undefined;
    }

    const animation = Animated.sequence([
      Animated.timing(valueScale, {
        toValue: 1.025,
        duration: 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(valueScale, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [playerValueKey, reduced, valueScale]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.seatMotion,
        motion,
        {
          transform: [
            ...motion.transform,
            { scale: activeScale },
            { scale: valueScale },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function GamePanelMotion({
  children,
  motionKey = "panel:mount",
  style,
}) {
  const motion = useEntranceAnimation(motionKey, {
    distance: 12,
    scale: 0.985,
    duration: 220,
  });

  return (
    <Animated.View style={[styles.panelMotion, motion, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardMotion: { position: "relative" },
  cardHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(53,216,255,0.55)",
    shadowColor: "#35D8FF",
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  seatMotion: { alignSelf: "stretch" },
  panelMotion: { flex: 1 },
});
