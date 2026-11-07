import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { useEffect, useRef } from "react";
import { ScrollView, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";

import { ExploreCard } from "./explore-card";
import { space } from "@/lib/theme";

// Why: the next card shows its edge, so the row reads as one you can swipe.
const PEEK = 28;

/** The map's listings as a row of cards: swiping picks the next pin, and tapping a pin brings its card. */
export function ExploreDeck({
  trips,
  picked,
  onPick,
  starting,
  onStart,
  onOpen,
}: {
  trips: PresetTrip[];
  picked: string;
  onPick: (id: string) => void;
  starting: boolean;
  onStart: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const { width } = useWindowDimensions();
  const card = width - space.lg * 2 - PEEK;
  const step = card + space.sm;
  const deck = useRef<ScrollView>(null);
  const index = Math.max(0, trips.findIndex((t) => t.id === picked));

  useEffect(() => {
    deck.current?.scrollTo({ x: index * step, animated: true });
  }, [index, step]);

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = trips[Math.round(event.nativeEvent.contentOffset.x / step)];
    if (next && next.id !== picked) onPick(next.id);
  };

  return (
    <ScrollView
      ref={deck}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={step}
      decelerationRate="fast"
      disableIntervalMomentum
      onMomentumScrollEnd={settle}
      contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm }}
    >
      {trips.map((trip, i) => (
        <ExploreCard
          key={trip.id}
          trip={trip}
          pin={i + 1}
          width={card}
          starting={starting && trip.id === picked}
          onStart={() => onStart(trip.id)}
          onOpen={() => onOpen(trip.id)}
        />
      ))}
    </ScrollView>
  );
}
