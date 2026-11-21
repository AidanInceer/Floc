import { formatDateRange, nightsBetween } from "@floc/core/dates/dates";
import { toggleTripPeople, type TripPeopleSelection } from "@floc/core/people/group-ticks";
import { countWord } from "@floc/core/text/count-word";
import { TEXT_CAPS } from "@floc/core/text/text";
import { startDots, startSteps, type StartStep } from "@floc/core/trip/start/start-steps";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { RangePicker } from "@/components/days/range-picker";
import { AskRow, PlacesField, StepFooter, StepTitle, SummaryRows } from "@/components/onboarding/start-parts";
import { TripPeoplePicker } from "@/components/social/trip-people-picker";
import { Body, Button, Field } from "@/components/system/ui";
import { useTheme } from "@/components/system/theme";
import { trpc } from "@/lib/api";
import type { DateRange } from "@/lib/dates/range";
import { askForPushOnce } from "@/lib/push/push";
import { space } from "@/lib/theme";

function whenText(range: DateRange | null): string {
  if (!range) return "Not decided yet";
  return `${formatDateRange(range.start, range.end)} · ${countWord(nightsBetween(range.start, range.end), "night")}`;
}

export default function NewTrip() {
  const router = useRouter();
  const { c } = useTheme();
  const queryClient = useQueryClient();
  const { name: asked, wish, along: alongIds } = useLocalSearchParams<{ name?: string; wish?: string; along?: string }>();
  const [name, setName] = useState((asked ?? "").trim().slice(0, TEXT_CAPS.tripName));
  const [where, setWhere] = useState<boolean | null>(null);
  const [dates, setDates] = useState<boolean | null>(null);
  const [places, setPlaces] = useState<string[]>([]);
  const [range, setRange] = useState<DateRange | null>(null);
  const [selection, setSelection] = useState<TripPeopleSelection>(() => ({ ticked: new Set((alongIds ?? "").split(",").filter(Boolean)), groups: new Set() }));
  const [at, setAt] = useState(0);
  const wishId = Number(wish);
  const along = useQuery({ ...trpc.wishes.peopleToAsk.queryOptions({ listId: wishId }), enabled: Number.isSafeInteger(wishId) && wishId > 0 });
  const [tickedAlong, setTickedAlong] = useState(false);
  if (along.data && !tickedAlong) {
    setTickedAlong(true);
    setSelection((now) => ({ ...now, ticked: new Set([...now.ticked, ...along.data.map((p) => p.id)]) }));
  }

  const create = useMutation({
    ...trpc.trips.create.mutationOptions(),
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
      void queryClient.invalidateQueries({ queryKey: trpc.groups.list.queryKey() });
      router.replace(`/trip/${trip.id}` as never);
      void askForPushOnce();
    },
  });

  const steps = startSteps({ fromListing: false, where, dates });
  const i = Math.min(at, steps.length - 1);
  const step: StartStep = steps[i] as StartStep;
  const answerDates = (value: boolean | null) => {
    setDates(value);
    if (value !== true) setRange(null);
  };
  const last = i === steps.length - 1;
  const submit = () =>
    create.mutate({
      name: name.trim(),
      startDate: range?.start ?? null,
      endDate: range?.end ?? null,
      friendIds: [...selection.ticked],
      groupIds: [...selection.groups],
      places,
    });

  const body: Record<StartStep, () => React.ReactNode> = {
    ask: () => (
      <>
        <StepTitle title="Start a trip" sub="Two quick questions, then only what you need." />
        <AskRow question="Do you know where?" value={where} onAnswer={setWhere} />
        <AskRow question="Do you have dates?" value={dates} onAnswer={answerDates} />
      </>
    ),
    where: () => (
      <>
        <StepTitle title="Where to?" sub="One place, or a few in order." />
        <PlacesField places={places} onChange={setPlaces} />
      </>
    ),
    dates: () => (
      <>
        <StepTitle title="When do you go?" sub={range ? countWord(nightsBetween(range.start, range.end), "night") : "Press the first day, then the last."} />
        <RangePicker value={range} onChange={setRange} />
        <View style={{ alignItems: "center" }}><Button label="No dates yet" variant="quiet" fit="small" onPress={() => answerDates(false)} /></View>
      </>
    ),
    who: () => (
      <>
        <StepTitle title="Who’s coming?" sub="Anyone else joins on the trip’s invite link." />
        <TripPeoplePicker ticked={selection.ticked} onToggle={(ids, groupId) => setSelection((now) => toggleTripPeople(now, ids, groupId))} />
      </>
    ),
    name: () => (
      <>
        <StepTitle title="Choose a name for the trip" />
        <SummaryRows rows={[["Where", places.length ? places.join(", ") : "Not decided yet"], ["When", whenText(range)], ["Who", selection.ticked.size ? `You and ${countWord(selection.ticked.size, "other")}` : "Just you for now"]]} />
        <Field label="Name" value={name} onChangeText={setName} maxLength={TEXT_CAPS.tripName} />
        {create.isError ? <Body tone="red">{create.error.message}</Body> : null}
      </>
    ),
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.paper }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }} keyboardShouldPersistTaps="handled">
        {body[step]()}
      </ScrollView>
      <View style={{ paddingBottom: space.lg, borderTopWidth: 1, borderTopColor: c.rule, backgroundColor: c.sheet }}>
        <StepFooter
          left={<Button label={i === 0 ? "Cancel" : "Back"} variant="quiet" fit="small" onPress={() => (i === 0 ? router.back() : setAt(i - 1))} />}
          dots={startDots(steps, i)}
          right={last ? <Button label="Create trip" fit="small" busy={create.isPending} disabled={!name.trim()} onPress={submit} /> : <Button label="Next" fit="small" onPress={() => setAt(i + 1)} />}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
