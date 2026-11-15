/** Your home airport, found by code, name or city (#574, ADR-057), as on the web. A pick saves at once; the list loads with the picker. */
import { airportLabel, airportPlace, findAirport, loadAirports, searchAirports, type Airport } from "@floc/core/money/estimate/guide/airports/airports";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/components/system/theme";
import { Body, Button, Label, SearchField } from "@/components/system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

function Hit({ airport, onPick }: { airport: Airport; onPick: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={airportLabel(airport)}
      onPress={onPick}
      style={({ pressed }) => ({ paddingVertical: space.sm, paddingHorizontal: space.md, gap: 2, backgroundColor: pressed ? c["pen-2"] : "transparent", borderRadius: radius.sm })}
    >
      <Body>{airport.name}</Body>
      <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label }}>{airportPlace(airport)}</Text>
    </Pressable>
  );
}

export function AirportPicker({ code, busy, onPick }: { code: string | null; busy: boolean; onPick: (code: string | null) => void }) {
  const [airports, setAirports] = useState<Airport[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [typed, setTyped] = useState<string | null>(null);
  useEffect(() => {
    loadAirports().then(setAirports, () => { setFailed(true); });
  }, []);

  const chosen = airports ? findAirport(airports, code) : null;
  const shown = typed ?? (chosen ? airportLabel(chosen) : code ?? "");
  const hits = airports && typed ? searchAirports(airports, typed) : [];
  const pick = (next: string | null) => {
    setTyped(null);
    onPick(next);
  };

  return (
    <View style={{ gap: space.sm }}>
      <Label>Home airport</Label>
      <SearchField label="Home airport" value={shown} onChangeText={setTyped} selectTextOnFocus autoCorrect={false} returnKeyType="search" />
      {hits.map((airport) => <Hit key={airport.code} airport={airport} onPick={() => { pick(airport.code); }} />)}
      {airports && typed?.trim() && hits.length === 0 ? <Body tone="ink-3">No airport found</Body> : null}
      {failed ? <Body tone="red">The airport list did not load. Close this and try again.</Body> : null}
      {code && typed === null ? <Button label="Clear" variant="quiet" fit="small" busy={busy} onPress={() => { pick(null); }} /> : null}
    </View>
  );
}
