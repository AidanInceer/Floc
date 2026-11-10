/**
 * Creating a trip (#291). Why "When?" is three answers, not two date boxes: typing YYYY-MM-DD was
 * the screen's whole problem, and "ask the group" is a real answer — it opens Dates after (rule 9).
 */
import { formatDateRange } from "@floc/core/dates/dates";
import { peopleCount, toggleTripPeople, type TripPeopleSelection } from "@floc/core/people/group-ticks";
import { TEXT_CAPS } from "@floc/core/text/text";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { RangePicker } from "@/components/days/range-picker";
import { TripPeoplePicker } from "@/components/social/trip-people-picker";
import { Body, Button, Field, Figure, SectionTitle, Segmented } from "@/components/system/ui";
import { useTheme } from "@/components/system/theme";
import { trpc } from "@/lib/api";
import type { DateRange } from "@/lib/dates/range";
import { askForPushOnce } from "@/lib/push/push";
import { space } from "@/lib/theme";

type When = "pick" | "group" | "later";

const WHEN_OPTIONS = [
  { value: "pick", label: "Pick dates" },
  { value: "group", label: "Ask the group" },
  { value: "later", label: "Not sure yet" },
] as const;

export default function NewTrip() {
  const router = useRouter();
  const { c } = useTheme();
  const queryClient = useQueryClient();
  // Why: a want-to-go country on Lists starts a trip named after it (#467), as `/trips?new=` does on the web.
  const asked = useLocalSearchParams<{ name?: string }>().name;
  const [name, setName] = useState((asked ?? "").trim().slice(0, TEXT_CAPS.tripName));
  const [when, setWhen] = useState<When>("pick");
  const [range, setRange] = useState<DateRange | null>(null);
  const [selection, setSelection] = useState<TripPeopleSelection>(() => ({ ticked: new Set(), groups: new Set() }));
  const { ticked } = selection;

  const create = useMutation({
    ...trpc.trips.create.mutationOptions(),
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
      void queryClient.invalidateQueries({ queryKey: trpc.groups.list.queryKey() });
      const section = when === "group" ? "/dates" : "";
      router.replace(`/trip/${trip.id}${section}` as never);
      void askForPushOnce();
    },
  });

  const dated = when === "pick" && range !== null;
  const ready = name.trim() !== "";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ backgroundColor: c.paper }}
        contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Name" value={name} onChangeText={setName} maxLength={TEXT_CAPS.tripName} autoFocus />

        <TripPeoplePicker ticked={ticked} onToggle={(ids, groupId) => setSelection((now) => toggleTripPeople(now, ids, groupId))} />

        <View style={{ gap: space.sm }}>
          <SectionTitle>When?</SectionTitle>
          <Segmented options={WHEN_OPTIONS} value={when} onChange={setWhen} />
        </View>

        {when === "pick" ? (
          <View style={{ gap: space.sm }}>
            <RangePicker value={range} onChange={setRange} />
            {range ? <Figure>{formatDateRange(range.start, range.end)}</Figure> : null}
          </View>
        ) : null}

        {create.isError ? <Body tone="red">{create.error.message}</Body> : null}

        <Figure tone="ink-2">{ticked.size ? `${peopleCount(ticked.size)} asked along` : "Friends can join later"}</Figure>
        <Button
          label="Create trip"
          busy={create.isPending}
          disabled={!ready}
          onPress={() =>
            create.mutate({
              name: name.trim(),
              startDate: dated ? range.start : null,
              endDate: dated ? range.end : null,
              friendIds: [...ticked],
              groupIds: [...selection.groups],
            })
          }
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
