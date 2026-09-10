/**
 * Where the group sleeps, from the phone (ticket 308).
 *
 * DAY-FIRST (rule 3). This writes a span of days, not a stop. The span starts
 * on the run the selected day already belongs to, so extending a stay is one
 * date away rather than a re-pick.
 *
 * THE TRIP'S OWN PLACES COME FIRST. Sending the id back keeps the pin the map
 * draws from; re-typing the name would mint a second, coordinate-less row.
 *
 * SEARCH MAY GIVE NOTHING (rule 11). The geocoder being down is not an error
 * state — the typed name is saved as it stands, and the map simply has no pin.
 */
import { formatDate } from "@floc/core/dates/dates";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import { useQuery } from "@tanstack/react-query";

import { useTheme } from "../system/theme";
import { Body, Button, Card, Dropdown, Field } from "../system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

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
  /** First day of the run the selected day belongs to. */
  start: string;
  /** Every date this stay could reach, the start included. */
  dates: string[];
  /** The run's current end, and its place if it has one. */
  end: string;
  placeId: number | null;
  placeName: string | null;
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
  /** Null clears the span. */
  onSave: (end: string, place: OvernightChoice | null) => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [query, setQuery] = useState("");
  const [pick, setPick] = useState<OvernightChoice | null>(null);
  const [end, setEnd] = useState(span.end);

  // A keystroke is not a search. Nominatim allows one call a second and the
  // trip is not waiting on the difference.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(typed.trim()), 400);
    return () => clearTimeout(timer);
  }, [typed]);

  const hits = useQuery(
    trpc.places.search.queryOptions({ query }, { enabled: query.length > 2 }),
  );

  const chosen = pick
    ? "placeId" in pick
      ? (known.find((p) => p.id === pick.placeId)?.name ?? "")
      : pick.name
    : (span.placeName ?? "");

  return (
    <Card>
      <View style={{ gap: space.md }}>
        <Field
          label="Where you're sleeping"
          value={typed}
          onChangeText={(text) => {
            setTyped(text);
            setPick(text.trim() ? { name: text.trim(), providerId: null, lat: null, lng: null, countryCode: null } : null);
          }}
          placeholder={chosen || "Search a place"}
          autoFocus
        />

        {/* Hits and the trip's own places are the same gesture, so they are the
            same list — the trip's own on top, because they keep their pin. */}
        <View>
          {known.map((place) => (
            <Choice
              key={`known-${place.id}`}
              label={place.name}
              note="already on this trip"
              onPress={() => {
                setPick({ placeId: place.id });
                setTyped(place.name);
              }}
            />
          ))}
          {(hits.data ?? []).map((hit) => (
            <Choice
              key={hit.providerId}
              label={hit.name}
              note={hit.label}
              onPress={() => {
                setPick({
                  name: hit.name,
                  providerId: hit.providerId,
                  lat: hit.lat,
                  lng: hit.lng,
                  countryCode: hit.countryCode,
                });
                setTyped(hit.name);
              }}
            />
          ))}
        </View>

        <Dropdown
          label="Last night here"
          value={end}
          options={span.dates.map((date) => ({ value: date, label: formatDate(date) }))}
          onChange={setEnd}
        />

        {problem ? <Body tone="red">{problem}</Body> : null}

        <View style={{ flexDirection: "row", gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Cancel" variant="quiet" onPress={onCancel} />
          </View>
          <View style={{ flex: 2 }}>
            <Button
              label="Save"
              busy={busy}
              onPress={() =>
                onSave(end, pick ?? (span.placeId !== null ? { placeId: span.placeId } : null))
              }
            />
          </View>
        </View>

        {span.placeId !== null ? (
          <Button label="No overnight here" variant="danger" onPress={() => onSave(end, null)} />
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

function Choice({
  label,
  note,
  onPress,
}: {
  label: string;
  note: string;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: space.sm,
        backgroundColor: pressed ? c["sheet-2"] : "transparent",
      })}
    >
      <Body>{label}</Body>
      <Body tone="ink-3">{note}</Body>
    </Pressable>
  );
}
