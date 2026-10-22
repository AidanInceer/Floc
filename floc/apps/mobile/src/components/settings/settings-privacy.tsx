/**
 * Who can see your profile (ticket 46, on the phone).
 *
 * THE OVERRIDE SITS ABOVE THE PARTS, because when it is on they do not apply —
 * and the parts go quiet rather than disappearing, so nobody has to remember
 * what they had set while it was on.
 *
 * TWO TICK COLUMNS, NAMED ONCE. You always see your own profile, so there is
 * no "me" column; the rings nest, so ticking travelled with ticks friends too
 * (`tickRing` in @floc/core, the same rule the web uses).
 *
 * SAVED ON THE MOVE. No Save button: every control writes the whole privacy
 * record, so the screen and the row can never disagree about half of it.
 */
import { ringTicks, tickRing, type RingColumn } from "@floc/core/people/visibility";
import { Pressable, StyleSheet, View } from "react-native";

import { TickGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Toggle } from "../system/ui";
import { radius, space } from "@/lib/theme";

export type Visibility = "private" | "friends" | "trip_members";
export type PastTripsShow = "all" | "latest";

export type Privacy = {
  isPrivate: boolean;
  visibilityVibeTags: Visibility;
  visibilityTravelMap: Visibility;
  visibilityFriends: Visibility;
  pastTripsShow: PastTripsShow;
};

const COLUMNS: { ring: RingColumn; label: string }[] = [
  { ring: "friends", label: "Friends" },
  { ring: "trip_members", label: "Travelled with" },
];

const PARTS = [
  { key: "visibilityVibeTags", label: "Vibe tags" },
  { key: "visibilityTravelMap", label: "Travel map" },
  { key: "visibilityFriends", label: "Friends list" },
] as const;

const CELL = 92;

function Tick({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      style={{ width: CELL, alignItems: "center" }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.sm - 3,
          borderWidth: 1.5,
          borderColor: on ? c.pen : c["rule-2"],
          backgroundColor: on ? c.pen : c.sheet,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {on ? <TickGlyph color={c.sheet} /> : null}
      </View>
    </Pressable>
  );
}

export function SettingsPrivacy({
  privacy,
  onChange,
}: {
  privacy: Privacy;
  onChange: (next: Privacy) => void;
}) {
  const { c } = useTheme();
  const rule = { borderColor: c.rule, borderBottomWidth: StyleSheet.hairlineWidth };
  return (
    <View style={{ gap: space.md }}>
      <Toggle
        label="Private profile"
        hint="Only your name shows."
        value={privacy.isPrivate}
        onChange={(isPrivate) => onChange({ ...privacy, isPrivate })}
      />

      <View
        pointerEvents={privacy.isPrivate ? "none" : "auto"}
        style={{ opacity: privacy.isPrivate ? 0.4 : 1 }}
      >
        <View style={[{ flexDirection: "row", paddingBottom: space.sm }, rule]}>
          <View style={{ flex: 1 }} />
          {COLUMNS.map((col) => (
            <View key={col.ring} style={{ width: CELL, alignItems: "center" }}>
              <Body tone="ink-2">{col.label}</Body>
            </View>
          ))}
        </View>
        {PARTS.map((part) => {
          const ring = privacy[part.key];
          const ticks = ringTicks(ring);
          return (
            <View
              key={part.key}
              style={[{ flexDirection: "row", alignItems: "center", minHeight: 48 }, rule]}
            >
              <View style={{ flex: 1 }}>
                <Body>{part.label}</Body>
                {ring === "private" ? <Body tone="ink-3">Only you</Body> : null}
              </View>
              {COLUMNS.map((col) => (
                <Tick
                  key={col.ring}
                  on={ticks[col.ring]}
                  label={`${part.label}: ${col.label}`}
                  onPress={() =>
                    onChange({ ...privacy, [part.key]: tickRing(ring, col.ring, !ticks[col.ring]) })
                  }
                />
              ))}
            </View>
          );
        })}
      </View>

      <Toggle
        label="Only my latest past trip"
        value={privacy.pastTripsShow === "latest"}
        onChange={(latest) => onChange({ ...privacy, pastTripsShow: latest ? "latest" : "all" })}
      />
    </View>
  );
}
