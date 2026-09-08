/**
 * Painting the travel map by hand, on a phone (ticket 108).
 *
 * STILL A SEARCH, NOW THAT THERE IS A MAP. `TravelMap` draws the world and
 * takes taps, which covers the countries you can hit; this covers the ones you
 * cannot. Andorra is four pixels wide — typing three letters of its name will
 * always beat pinching for it.
 *
 * TWO MARKS, NOT THREE. Been and want-to-go are the answers; blank is what you
 * get by turning one off, which is why each row is two toggles rather than a
 * three-way picker with a "neither" nobody would pick on purpose.
 *
 * SEARCH IS THE LIST. Two hundred and fifty countries is not a scroll, so
 * nothing is drawn until a name is typed — except the ones already marked,
 * which are what you came to change.
 */
import { COUNTRIES, countryName } from "@floc/core/countries";
import { useState } from "react";
import { View } from "react-native";

import { Body, Empty, Field, IconButton, Label, Row } from "./ui";
import { FlagGlyph, TickGlyph } from "./glyphs";
import { space } from "@/lib/theme";

export type CountryMark = { code: string; state: "green" | "yellow" };

/** As many as a sheet can show without becoming a scroll of its own. */
const MAX_RESULTS = 20;

export function MarkEditor({
  marks,
  busy,
  onSet,
}: {
  marks: CountryMark[];
  busy: boolean;
  /** `blank` turns a mark off — over a country a trip claims, the host stores that as "no, I didn't go". */
  onSet: (code: string, state: "green" | "yellow" | "blank") => void;
}) {
  const [query, setQuery] = useState("");

  const stateOf = (code: string) => marks.find((m) => m.code === code)?.state ?? null;

  const term = query.trim().toLowerCase();
  const shown = term
    ? COUNTRIES.filter((country) => country.name.toLowerCase().includes(term)).slice(
        0,
        MAX_RESULTS,
      )
    : marks
        .map((mark) => ({ code: mark.code, name: countryName(mark.code) }))
        .sort((a, b) => a.name.localeCompare(b.name, "en-GB"));

  return (
    <View style={{ padding: space.lg, gap: space.md }}>
      <Label>Paint the map</Label>
      <Field
        label="Find a country"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        placeholder="Portugal"
      />

      {shown.length === 0 ? (
        <Empty>{term ? "No country by that name." : "Nothing marked by hand yet."}</Empty>
      ) : null}

      {shown.map((country) => {
        const state = stateOf(country.code);
        return (
          <Row key={country.code}>
            <View style={{ flex: 1 }}>
              <Body>{country.name}</Body>
              {/* The state is a word, never the fill alone (#204). */}
              <Body tone="ink-3">
                {state === "green" ? "Been" : state === "yellow" ? "Want to go" : "Not marked"}
              </Body>
            </View>
            <IconButton
              label={`Been to ${country.name}`}
              on={state === "green"}
              disabled={busy}
              onPress={() => onSet(country.code, state === "green" ? "blank" : "green")}
            >
              {(color) => <TickGlyph color={color} />}
            </IconButton>
            <IconButton
              label={`Want to go to ${country.name}`}
              on={state === "yellow"}
              disabled={busy}
              onPress={() => onSet(country.code, state === "yellow" ? "blank" : "yellow")}
            >
              {(color) => <FlagGlyph color={color} />}
            </IconButton>
          </Row>
        );
      })}
    </View>
  );
}
