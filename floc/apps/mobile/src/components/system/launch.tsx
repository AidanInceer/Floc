/**
 * The hand-off out of the native splash (#no-ticket).
 *
 * Android draws `assets/splash.png` — the three chevrons, centred on the
 * paper — before any JS exists. This redraws exactly that, in vector, at the
 * same size and place, so the swap from image to component is invisible. Then
 * the chevrons accelerate off the top and the paper clears under them, and the
 * first screen is revealed by the same movement that ends the launch.
 *
 * NO ENTRANCE. The chevrons are already on screen when this mounts; fading
 * them in would fade in something the holder is already looking at.
 *
 * THE GEOMETRY IS MEASURED, NOT GUESSED. In `splash.png` the chevron block is
 * 361×176 inside a 1284×2778 canvas laid out `contain`, i.e. 28.1% of the
 * shorter edge. `MARK_FRACTION` keeps that ratio on any screen; drift here
 * shows up as the mark jumping at the swap.
 *
 * Built on RN's own `Animated`: a slide and a fade do not earn a native
 * module, and one would cost the app a rebuild.
 */
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "./theme";

const EXIT_MS = 460;
/** The chevron block, as a share of the screen width. See the note above. */
const MARK_FRACTION = 361 / 1284;
/** The block sits x 2.4–23.6 of the 26-unit viewBox — 21.2 units of 26. */
const VIEWBOX_SLACK = 26 / 21.2;

export function LaunchCurtain({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const { c } = useTheme();
  const { width, height } = useWindowDimensions();
  const lift = useRef(new Animated.Value(0)).current;
  const paper = useRef(new Animated.Value(1)).current;

  const markWidth = width * MARK_FRACTION * VIEWBOX_SLACK;

  useEffect(() => {
    if (!ready) return;
    Animated.parallel([
      Animated.timing(lift, {
        toValue: 1,
        duration: EXIT_MS,
        // Accelerating, not easing out: the mark is leaving, not arriving.
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
    ]).start(({ finished }) => finished && onDone());
  }, [ready, lift, paper, onDone]);

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
                // Past the top edge, not to it: gone before it stops.
                outputRange: [0, -(height * 0.62)],
              }),
            },
          ],
        }}
      >
        <Svg width={markWidth} height={markWidth * (20 / 26)} viewBox="0 0 26 20" fill="none">
          <Path
            d="M3 14 6.5 10.5 10 14"
            stroke={c.pen}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9.5 8.5 13 5 16.5 8.5"
            stroke={c.pen}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M16 14 19.5 10.5 23 14"
            stroke={c.pen}
            strokeWidth={1.2}
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
