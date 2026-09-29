import { AccessibilityInfo } from "react-native";

export function observeReducedMotion(changed: (reduced: boolean) => void): () => void {
  let active = true;
  let receivedChange = false;
  const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (reduced) => {
    receivedChange = true;
    if (active) changed(reduced);
  });
  const initial = (reduced: boolean) => {
    if (active && !receivedChange) changed(reduced);
  };
  void AccessibilityInfo.isReduceMotionEnabled().then(initial, () => initial(true));
  return () => {
    active = false;
    subscription.remove();
  };
}
