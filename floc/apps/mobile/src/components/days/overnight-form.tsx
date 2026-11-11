/**
 * Where the group sleeps, from the phone (ticket 308).
 *
 * DAY-FIRST (rule 3). This writes a span of days, not a stop. The first and last
 * night are picked on the month calendar (wireframe/days-week F), with a line
 * saying what the stay takes from another one.
 *
 * THE TRIP'S OWN PLACES COME FIRST. Sending the id back keeps the pin the map
 * draws from; re-typing the name would mint a second, coordinate-less row.
 *
 * SEARCH MAY GIVE NOTHING (rule 11). The geocoder being down is not an error
 * state — the typed name is saved as it stands, and the map simply has no pin.
 */
import type { IsoDate } from "@floc/core/dates/dates";
import { stayNights, stayOpening, stayWrites, type Night, type StayWrite } from "@floc/core/itinerary/stay/overnight-pick";
import { previewNight, tapNight, type NightPick } from "@floc/core/itinerary/stay/stay-calendar";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useQuery } from "@tanstack/react-query";

import { NightCalendar } from "./night-calendar";
import { useTheme } from "../system/theme";
import { Body, Button, Card, Field, Label } from "../system/ui";
import { trpc } from "@/lib/api";
import { fonts, radius, size, space } from "@/lib/theme";

/** What the API takes: an id the trip already uses, a fresh pick, or null to clear. */
export type OvernightChoice =
  | { placeId: number }
  | {
      name: string;
      providerId: string | null;
      lat: number | null;
      lng: number | null;
      countryCode: string | null;
    };

export type OvernightSpan = {
  /** The stop's first and last day, and its place if it has one. */
  start: IsoDate;
  end: IsoDate;
  placeId: number | null;
  placeName: string | null;
  /** Every day of the trip, in order; the last is check-out, not a night. */
  days: Night[];
};

export function OvernightForm({
  span,
  known,
  busy,
  problem,
  onSave,
  onCancel,
}: {
  span: OvernightSpan;
  /** Places this trip's days already point at — an extend keeps the pin. */
  known: { id: number; name: string }[];
  busy: boolean;
  problem: string | null;
  /** The writes in order: the stay first, then the old nights it gives back. Null clears. */
  onSave: (writes: StayWrite[], place: OvernightChoice | null) => void;
  onCancel: () => void;
}) {
  const tripEnd = span.days.at(-1)?.date ?? span.end;
  const [typed, setTyped] = useState("");
  const [query, setQuery] = useState("");
  const [choice, setChoice] = useState<OvernightChoice | null>(null);
  const [pick, setPick] = useState<NightPick>(() => ({ ...stayOpening(span, tripEnd), picking: false }));

  // A keystroke is not a search. Nominatim allows one call a second and the
  // trip is not waiting on the difference.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(typed.trim()), 400);
    return () => clearTimeout(timer);
  }, [typed]);

  const hits = useQuery(
    trpc.places.search.queryOptions({ query }, { enabled: query.length > 2 }),
  );

  const choose = (next: OvernightChoice, name: string) => {
    setChoice(next);
    setTyped(name);
  };
  const place = choice ?? (span.placeId !== null ? { placeId: span.placeId } : null);

  return (
    <Card>
      <View style={{ gap: space.md }}>
        <Field
          label="Where you're sleeping"
          value={typed}
          onChangeText={(text) => {
            setTyped(text);
            setChoice(text.trim() ? { name: text.trim(), providerId: null, lat: null, lng: null, countryCode: null } : null);
          }}
          autoFocus
        />

        {/* Hits and the trip's own places are the same gesture, so they are the
            same list — the trip's own on top, because they keep their pin. */}
        <View>
          {known.map((row) => (
            <Choice
              key={`known-${row.id}`}
              label={row.name}
              note="already on this trip"
              current={row.id === span.placeId}
              onPress={() => choose({ placeId: row.id }, row.name)}
            />
          ))}
          {(hits.data ?? []).map((hit) => (
            <Choice
              key={hit.providerId}
              label={hit.name}
              note={hit.label}
              onPress={() =>
                choose({ name: hit.name, providerId: hit.providerId, lat: hit.lat, lng: hit.lng, countryCode: hit.countryCode }, hit.name)
              }
            />
          ))}
        </View>

        <StayNights span={span} pick={pick} name={typed.trim() || span.placeName || ""} onTap={(date) => setPick((p) => tapNight(p, date))} />

        {problem ? <Body tone="red">{problem}</Body> : null}

        <View style={{ flexDirection: "row", gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Cancel" variant="quiet" onPress={onCancel} />
          </View>
          <View style={{ flex: 2 }}>
            <Button label="Save" busy={busy} onPress={() => place && onSave(stayWrites(span, pick.start, pick.end, tripEnd), place)} />
          </View>
        </View>

        {span.placeId !== null ? (
          <NoOvernight onPress={() => onSave([{ start: span.start, end: span.end, clear: true }], null)} />
        ) : null}

      </View>
      {/* Silence is the answer when the provider is down (rule 11) — the typed
          name still saves, so there is nothing to explain. */}
      {hits.isPending && query.length > 2 ? (
        <View style={{ paddingTop: space.sm }}>
          <Body tone="ink-3">Searching…</Body>
        </View>
      ) : null}
    </Card>
  );
}

function StayNights({ span, pick, name, onTap }: { span: OvernightSpan; pick: NightPick; name: string; onTap: (date: IsoDate) => void }) {
  const { c } = useTheme();
  const nightDays = span.days.length > 1 ? span.days.slice(0, -1) : span.days;
  const nights = stayNights(nightDays, { start: pick.start, placeId: span.placeId }, pick.end);
  const placeOf = (date: IsoDate) =>
    previewNight(date, nightDays.find((d) => d.date === date)?.placeName ?? null, pick, span, name);
  const line = { color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small };

  return (
    <View>
      <View style={{ marginBottom: space.xs }}>
        <Label>First and last night</Label>
      </View>
      <NightCalendar nights={nightDays.map((d) => d.date)} pick={pick} placeOf={placeOf} onTap={onTap} />
      <Text accessibilityLiveRegion="polite" style={[line, { fontFamily: fonts.type, marginTop: space.sm }]}>{nights.label}</Text>
      {/* Why: a line held open, so the sheet does not move under the next tap. */}
      <View style={{ minHeight: 18, gap: space.xs }}>
        {nights.taken.map((taken) => (
          <Text key={taken} style={line}>{taken}</Text>
        ))}
      </View>
    </View>
  );
}

function Choice({
  label,
  note,
  current,
  onPress,
}: {
  label: string;
  note: string;
  current?: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        minHeight: 48,
        paddingVertical: space.sm,
        paddingHorizontal: space.sm,
        borderRadius: radius.sm,
        backgroundColor: current ? c["pen-2"] : pressed ? c["sheet-2"] : "transparent",
      })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: current ? c["pen-deep"] : c.ink, fontFamily: current ? fonts.sansBold : fonts.sans, fontSize: size.body }}>{label}</Text>
        <Body tone="ink-3">{note}</Body>
      </View>
      {current ? <Text style={{ color: c["pen-deep"], fontFamily: fonts.sansBold, fontSize: size.small }}>Now</Text> : null}
    </Pressable>
  );
}

/** Clearing the stop is a quiet red word, not a second big button under Save. */
function NoOvernight({ onPress }: { onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={({ pressed }) => ({ alignSelf: "center", minHeight: 44, justifyContent: "center", opacity: pressed ? 0.6 : 1 })}>
      <Text style={{ color: c.red, fontFamily: fonts.sans, fontSize: size.small }}>No overnight here</Text>
    </Pressable>
  );
}
