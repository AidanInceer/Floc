/**
 * Who can see your profile (ticket 46, on the phone).
 *
 * THE OVERRIDE SITS ABOVE THE RINGS, because when it is on they do not apply —
 * and the rings go quiet rather than disappearing, so nobody has to remember
 * what they had set while it was on.
 *
 * ONE RING PER ATTRIBUTE, SAME THREE WORDS EVERY TIME. `Segmented` fits three
 * short options across a phone; "Friends and travelled with" does not, so the
 * widest ring is "Travelled with" here. The nesting is unchanged — it is the
 * same value, said in the width available.
 *
 * SAVED ON THE MOVE. No Save button: every control writes the whole privacy
 * record, so the screen and the row can never disagree about half of it.
 */
import { View } from "react-native";

import { Body, Label, Segmented, Toggle } from "../system/ui";
import { space } from "@/lib/theme";

export type Visibility = "private" | "friends" | "trip_members";
export type PastTripsShow = "all" | "latest";

export type Privacy = {
  isPrivate: boolean;
  visibilityVibeTags: Visibility;
  visibilityTravelMap: Visibility;
  visibilityFriends: Visibility;
  pastTripsShow: PastTripsShow;
};

const RINGS: readonly { value: Visibility; label: string }[] = [
  { value: "private", label: "Only me" },
  { value: "friends", label: "Friends" },
  { value: "trip_members", label: "Travelled with" },
];

/** The four attributes, in the order the web lists them. */
const ATTRIBUTES = [
  { key: "visibilityVibeTags", label: "Vibe tags" },
  { key: "visibilityTravelMap", label: "Travel map" },
  { key: "visibilityFriends", label: "Your friends list" },
] as const;

export function SettingsPrivacy({
  privacy,
  onChange,
}: {
  privacy: Privacy;
  onChange: (next: Privacy) => void;
}) {
  return (
    <View style={{ gap: space.md }}>
      <Label>Who can see your profile</Label>

      <Toggle
        label="Make my whole profile private"
        hint="People can still open your face — they see your name and picture, nothing else."
        value={privacy.isPrivate}
        onChange={(isPrivate) => onChange({ ...privacy, isPrivate })}
      />

      {ATTRIBUTES.map((attribute) => (
        <View key={attribute.key} style={{ gap: space.xs, opacity: privacy.isPrivate ? 0.4 : 1 }}>
          <Label>{attribute.label}</Label>
          <Segmented
            options={RINGS}
            value={privacy[attribute.key]}
            onChange={(value) => onChange({ ...privacy, [attribute.key]: value })}
          />
        </View>
      ))}

      {/* What is missing is worth saying; that the rings are dimmed is not. */}
      <Body tone="ink-3">
        Anyone who has made their own profile private stays off your friends list whatever you
        choose.
      </Body>

      <View style={{ gap: space.xs, opacity: privacy.isPrivate ? 0.4 : 1 }}>
        <Label>Past trips</Label>
        <Segmented
          options={[
            { value: "all", label: "All of them" },
            { value: "latest", label: "Most recent only" },
          ]}
          value={privacy.pastTripsShow}
          onChange={(pastTripsShow) => onChange({ ...privacy, pastTripsShow })}
        />
      </View>
    </View>
  );
}
