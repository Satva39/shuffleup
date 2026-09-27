import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";

const BASE_BOTTOM_PADDING = 36;
const FOCUS_GAP = 24;

export default function Screen({ children, scroll = true, contentStyle }) {
  const scrollRef = useRef(null);
  const scrollYRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const keyboardTopRef = useRef(null);
  const retryTimersRef = useRef([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const clearRetries = () => {
    retryTimersRef.current.forEach((timer) => clearTimeout(timer));
    retryTimersRef.current = [];
  };

  const updateKeyboard = (event) => {
    const nextHeight = Math.max(0, event?.endCoordinates?.height ?? 0);
    const nextTop = event?.endCoordinates?.screenY ?? null;

    keyboardHeightRef.current = nextHeight;
    keyboardTopRef.current = nextTop;
    setKeyboardHeight(nextHeight);
  };

  const keepFocusedInputVisible = () => {
    if (!scrollRef.current || keyboardTopRef.current == null) return;

    const focusedInput = TextInput.State.currentlyFocusedInput?.();
    if (!focusedInput || typeof focusedInput.measureInWindow !== "function")
      return;

    focusedInput.measureInWindow((_x, y, _width, height) => {
      const keyboardTop = keyboardTopRef.current;
      if (keyboardTop == null) return;

      const inputBottom = y + height;
      const visibleBottom = keyboardTop - FOCUS_GAP;
      const overlap = inputBottom - visibleBottom;

      if (overlap > 0) {
        const nextY = Math.max(0, scrollYRef.current + overlap);
        scrollRef.current.scrollTo({ y: nextY, animated: true });
        return;
      }

      if (y < 8 && scrollYRef.current > 0) {
        scrollRef.current.scrollTo({
          y: Math.max(0, scrollYRef.current - (8 - y)),
          animated: true,
        });
      }
    });
  };

  const scheduleInputVisibility = () => {
    clearRetries();
    [40, 100, 180, 300, 450].forEach((delay) => {
      retryTimersRef.current.push(setTimeout(keepFocusedInputVisible, delay));
    });
  };

  useEffect(() => {
    if (!scroll) return undefined;

    const showSubscription = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        updateKeyboard(event);
        scheduleInputVisibility();
      },
    );

    const changeSubscription = Keyboard.addListener(
      Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillChangeFrame",
      (event) => {
        updateKeyboard(event);
        scheduleInputVisibility();
      },
    );

    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      keyboardHeightRef.current = 0;
      keyboardTopRef.current = null;
      setKeyboardHeight(0);
      clearRetries();
    });

    return () => {
      showSubscription.remove();
      changeSubscription.remove();
      hideSubscription.remove();
      clearRetries();
    };
  }, [scroll]);

  const dynamicScroll = [
    styles.scroll,
    {
      paddingBottom: BASE_BOTTOM_PADDING + keyboardHeight,
    },
  ];

  const body = <View style={[styles.body, contentStyle]}>{children}</View>;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={dynamicScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            nestedScrollEnabled
            scrollEventThrottle={16}
            onScroll={(event) => {
              scrollYRef.current = event.nativeEvent.contentOffset.y;
            }}
            onContentSizeChange={() => {
              if (keyboardHeightRef.current > 0) {
                scheduleInputVisibility();
              }
            }}
            onLayout={() => {
              if (keyboardHeightRef.current > 0) {
                scheduleInputVisibility();
              }
            }}
          >
            {body}
          </ScrollView>
        ) : (
          <View style={styles.nonScrollKeyboardContent}>{body}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboard: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  nonScrollKeyboardContent: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
});
