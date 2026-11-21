import { CURRENCIES, currencyName, type Currency } from "@floc/core/money/currency";
import { guessCurrency } from "@floc/core/money/local-currency";
import { TEXT_CAPS } from "@floc/core/text/text";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { AirportPicker, StylePicker, VibePicker, deviceCountry, type Style } from "./welcome-steps";
import { StepFooter, StepTitle } from "./start-parts";
import { Sheet } from "../system/sheet";
import { useTheme } from "../system/theme";
import { FlocWordmark } from "../system/wordmark";
import { Body, Button, ChoiceSheet, Field } from "../system/ui";
import { trpc } from "@/lib/api";
import { fonts, size, space } from "@/lib/theme";

const LAST = 4;

export function WelcomeGate({ invited }: { invited?: string | null }) {
  const welcome = useQuery(trpc.me.welcome.queryOptions());
  const [closed, setClosed] = useState(false);
  if (!welcome.data?.due || closed) return null;
  const guess = guessCurrency({ country: deviceCountry(), acceptLanguage: Intl.DateTimeFormat().resolvedOptions().locale });
  return <WelcomeSheet invited={invited ?? null} currency={welcome.data.currency === "GBP" ? guess : welcome.data.currency} onDone={() => setClosed(true)} />;
}

function WelcomeSheet({ invited, currency: guessed, onDone }: { invited: string | null; currency: Currency; onDone: () => void }) {
  const { c } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [at, setAt] = useState(0);
  const [airport, setAirport] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>(guessed);
  const [choosing, setChoosing] = useState(false);
  const [style, setStyle] = useState<Style>({});
  const [vibes, setVibes] = useState<string[]>([]);
  const [name, setName] = useState("");
  const finish = useMutation({
    ...trpc.me.finishWelcome.mutationOptions(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: trpc.me.welcome.queryKey() }),
  });
  const save = (then?: () => void) => {
    onDone();
    finish.mutate({ ...(airport ? { airport } : {}), currency, ...style, vibes });
    then?.();
  };

  const steps = [
    () => (
      <View style={{ alignItems: "center", gap: space.md }}>
        <Text style={{ fontFamily: fonts.display, fontSize: size.heading, color: c.ink }}>Welcome to</Text>
        <FlocWordmark />
        <Body tone="ink-2">{invited ? `You are on ${invited}. Three quick questions first.` : "Three quick questions, then you are in."}</Body>
      </View>
    ),
    () => (
      <>
        <StepTitle title="Where do you usually fly from?" />
        <AirportPicker code={airport} onCode={setAirport} />
        <Body tone="ink-2">Prices show in {currencyName(currency)} ({currency}).</Body>
        <Button label="Change currency" variant="quiet" fit="small" onPress={() => setChoosing(true)} />
        <ChoiceSheet open={choosing} title="Home currency" options={CURRENCIES.map((code) => ({ value: code, label: `${currencyName(code)} (${code})` }))} value={currency} onChange={(v) => { setCurrency(v as Currency); setChoosing(false); }} onClose={() => setChoosing(false)} />
      </>
    ),
    () => (
      <>
        <StepTitle title="How do you like to travel?" sub="One in each row, or none." />
        <StylePicker style={style} onStyle={setStyle} />
      </>
    ),
    () => (
      <>
        <StepTitle title="What are you into?" sub="Pick as many as you like." />
        <VibePicker vibes={vibes} onVibes={setVibes} />
      </>
    ),
    () => (
      <>
        <StepTitle title="Where to first?" />
        <Field label={invited ? "Name a trip of your own" : "Name your first trip"} value={name} onChangeText={setName} maxLength={TEXT_CAPS.tripName} />
        <Button label="Start" onPress={() => save(() => router.push({ pathname: "/(app)/new-trip", params: { name: name.trim() } } as never))} />
        {invited ? null : <Button label="Got a link?" variant="quiet" onPress={() => save(() => router.push("/(app)/join"))} />}
        <Button label="Browse Explore" variant="quiet" onPress={() => save(() => router.push("/explore" as never))} />
      </>
    ),
  ];

  const left = at === 0 ? <Button label="Skip for now" variant="quiet" fit="small" onPress={() => setAt(LAST)} /> : <Button label="Back" variant="quiet" fit="small" onPress={() => setAt(at - 1)} />;
  const right = at === 0 ? <Button label="Let’s go" fit="small" onPress={() => setAt(1)} /> : at === LAST ? <Button label="Look around" variant="quiet" fit="small" onPress={() => save()} /> : <Button label={at === LAST - 1 ? "Done" : "Next"} fit="small" onPress={() => setAt(at + 1)} />;
  return (
    <Sheet open onClose={() => save()} footer={<StepFooter left={left} right={right} dots={at < LAST ? { of: LAST, at } : undefined} />}>
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>{steps[at]?.()}</View>
    </Sheet>
  );
}
