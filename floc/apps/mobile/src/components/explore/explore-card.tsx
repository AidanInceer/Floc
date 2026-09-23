import { formatMoney } from "@floc/core/money/money";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { View } from "react-native";

import { Body, Button, Card, Figure, Heading, Pill } from "../system/ui";
import { space } from "@/lib/theme";

export function ExploreCard({
  trip,
  starting,
  onStart,
  onOpen,
}: {
  trip: PresetTrip;
  starting: boolean;
  onStart: () => void;
  onOpen: () => void;
}) {
  const bases = trip.legs.filter((l) => l.kind === "base").map((l) => l.place);

  return (
    <Card>
      <View style={{ gap: space.xs }}>
        <Pill word={trip.region} />
        <Heading>{trip.title}</Heading>
        <Figure tone="ink-2">
          {trip.nights} nights · {trip.groupSize} · {formatMoney(trip.priceFromMinor, trip.currency)} each
        </Figure>
        <Body tone="ink-2">{bases.join(" → ")}</Body>
      </View>
      <View style={{ gap: space.sm }}>
        <Button label="Start this trip" busy={starting} onPress={onStart} />
        <Button label="Open" variant="quiet" fit="small" onPress={onOpen} />
      </View>
    </Card>
  );
}
