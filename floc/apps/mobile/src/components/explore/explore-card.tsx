import { formatMoney } from "@floc/core/money/money";
import { SHORTLIST_CAP } from "@floc/core/trip/explore/explore-match";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";
import { View } from "react-native";

import { TickGlyph } from "../system/glyphs";
import { Body, Button, Card, Figure, Heading, Pill } from "../system/ui";
import { space } from "@/lib/theme";

export function ExploreCard({
  trip,
  saved,
  saving,
  starting,
  onStart,
  onOpen,
  onToggleSave,
}: {
  trip: PresetTrip;
  saved: string[];
  saving: boolean;
  starting: boolean;
  onStart: () => void;
  onOpen: () => void;
  onToggleSave: () => void;
}) {
  const isSaved = saved.includes(trip.id);
  const full = !isSaved && saved.length >= SHORTLIST_CAP;
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
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Button label="Open" variant="quiet" fit="small" onPress={onOpen} />
          <Button
            label={isSaved ? "Saved" : full ? "Shortlist full" : "Save"}
            variant="quiet"
            fit="small"
            icon={isSaved ? (ink) => <TickGlyph color={ink} /> : undefined}
            busy={saving}
            disabled={full}
            onPress={onToggleSave}
          />
        </View>
        <Figure tone="ink-3">
          Your shortlist · {saved.length} of {SHORTLIST_CAP}
        </Figure>
      </View>
    </Card>
  );
}
