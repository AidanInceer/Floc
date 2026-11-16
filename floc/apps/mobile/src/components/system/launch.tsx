import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "./theme";
import { useReducedMotion } from "./use-reduced-motion";

const EXIT_MS = 460;
const MARK_FRACTION = 361 / 1284;
const VIEWBOX_SLACK = 28 / 23.7;

export function LaunchCurtain({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const { c } = useTheme();
  const reducedMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const lift = useRef(new Animated.Value(0)).current;
  const paper = useRef(new Animated.Value(1)).current;

  const markWidth = width * MARK_FRACTION * VIEWBOX_SLACK;

  useEffect(() => {
    if (!ready || reducedMotion === null) return;
    if (reducedMotion) {
      onDone();
      return;
    }
    const exit = Animated.parallel([
      Animated.timing(lift, {
        toValue: 1,
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(paper, {
        toValue: 0,
        duration: EXIT_MS * 0.55,
        delay: EXIT_MS * 0.45,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    exit.start(({ finished }) => finished && onDone());
    return () => exit.stop();
  }, [ready, reducedMotion, lift, paper, onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.curtain, { backgroundColor: c.paper, opacity: paper }]}
    >
      <Animated.View
        style={{
          opacity: lift.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 1, 0] }),
          transform: [
            {
              translateY: lift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -(height * 0.62)],
              }),
            },
          ],
        }}
      >
        <Svg width={markWidth} height={markWidth * (22 / 28)} viewBox="0 0 28 22" fill="none">
          <Path
            d="M3.4 16.5 7 12.9 10.6 16.5"
            stroke={c.pen}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10.4 10 14 6.4 17.6 10"
            stroke={c.pen}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M17.4 16.5 21 12.9 24.6 16.5"
            stroke={c.pen}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  curtain: { alignItems: "center", justifyContent: "center", zIndex: 10 },
});
