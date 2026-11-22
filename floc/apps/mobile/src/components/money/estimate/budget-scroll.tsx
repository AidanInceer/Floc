import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Keyboard, ScrollView, type TextInput } from "react-native";

import { space } from "@/lib/theme";

const RevealContext = createContext<(field: TextInput | null) => void>(() => {});

export const useReveal = () => useContext(RevealContext);

export function BudgetScroll({ children }: { children: ReactNode }) {
  const scroll = useRef<ScrollView>(null);
  const offset = useRef(0);
  const field = useRef<TextInput | null>(null);
  const keyboardTop = useRef<number | null>(null);
  const [inset, setInset] = useState(0);

  const bring = useCallback(() => {
    const top = keyboardTop.current;
    if (top == null) return;
    field.current?.measureInWindow((_x, y, _width, height) => {
      const over = y + height + space.lg - top;
      if (over > 0) scroll.current?.scrollTo({ y: offset.current + over, animated: true });
    });
  }, []);

  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      setInset(event.endCoordinates.height);
      setTimeout(bring, 60);
    });
    const hidden = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTop.current = null;
      setInset(0);
    });
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, [bring]);

  const reveal = useCallback((next: TextInput | null) => {
    field.current = next;
    bring();
  }, [bring]);
  const style = useMemo(() => ({ padding: space.lg, paddingBottom: space.lg + inset, gap: space.lg }), [inset]);

  return (
    <RevealContext.Provider value={reveal}>
      <ScrollView
        ref={scroll}
        scrollEventThrottle={32}
        onScroll={(event) => { offset.current = event.nativeEvent.contentOffset.y; }}
        contentContainerStyle={style}
      >
        {children}
      </ScrollView>
    </RevealContext.Provider>
  );
}
