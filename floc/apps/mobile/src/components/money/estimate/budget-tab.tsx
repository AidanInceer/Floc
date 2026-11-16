import { LINE_LABELS } from "@floc/core/money/estimate/lines";
import type { PlanLine } from "@floc/core/money/estimate/plan";
import type { EstimateView } from "@floc/core/money/estimate/view";
import { wholeRange } from "@floc/core/money/estimate/words";
import { parseMoney } from "@floc/core/money/money";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";

import { EventSheet } from "@/components/days/event-sheet";
import { Body, Button, Card, Failed, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";

import { AirportForm, AmountForm, LineForm, NightsForm, StyleForm } from "./budget-forms";
import { BudgetView, type BudgetEdit } from "./budget-view";

function Lock() {
  const router = useRouter();
  return (
    <Card>
      <Body bold>Cost estimate and budget</Body>
      <Body tone="ink-2">See roughly what this trip will cost you, set your own budget and track it. Only you see it. A Floc Pro feature.</Body>
      <Button label="See Floc Pro" variant="quiet" fit="small" onPress={() => router.push({ pathname: "/settings", params: { pro: "1" } })} />
    </Card>
  );
}

type Actions = {
  budget: (raw: string) => void;
  line: (line: PlanLine["line"], figure: string, budget: string) => void;
  style: (style: EstimateView["style"] | null) => void;
  nights: (nights: number) => void;
  home: (code: string | null) => void;
};

const TITLE: Record<BudgetEdit["kind"], string> = {
  budget: "Your budget",
  line: "",
  style: "How you travel on this trip",
  home: "Where do you fly from?",
  nights: "How many nights?",
};

function SheetBody({ edit, view, airport, busy, act }: { edit: BudgetEdit; view: EstimateView; airport: string | null; busy: boolean; act: Actions }) {
  switch (edit.kind) {
    case "budget":
      return <AmountForm initial={view.plan.budget} currency={view.currency} label={`For the whole trip, ${view.currency}`} hint="Only you see it." busy={busy} onSave={act.budget} />;
    case "line": {
      const line = view.plan.lines.find((l) => l.line === edit.line);
      if (!line) return null;
      const guide = line.guide ? wholeRange(line.guide, view.currency) : "none yet";
      return <LineForm figure={line.own} budget={line.budget} currency={view.currency} guide={guide} busy={busy} onSave={(figure, budget) => act.line(line.line, figure, budget)} />;
    }
    case "style":
      return <StyleForm style={view.style} busy={busy} onSave={act.style} onReset={() => act.style(null)} />;
    case "nights":
      return <NightsForm initial={view.nights.count} busy={busy} onSave={act.nights} />;
    case "home":
      return <AirportForm initial={airport} suggested={view.home?.inferred ? view.home.code : null} busy={busy} onSave={act.home} />;
  }
}

export function BudgetTab({ tripId }: { tripId: number }) {
  const queryClient = useQueryClient();
  const [edit, setEdit] = useState<BudgetEdit | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const estimate = useQuery(trpc.estimate.view.queryOptions({ tripId }));
  const settings = useQuery(trpc.estimate.settings.queryOptions());

  const close = () => {
    setEdit(null);
    setProblem(null);
  };
  const done = () => {
    close();
    void queryClient.invalidateQueries({ queryKey: trpc.estimate.view.queryKey({ tripId }) });
    void queryClient.invalidateQueries({ queryKey: trpc.estimate.settings.queryKey() });
  };
  const on = { onSuccess: done, onError: (e: { message: string }) => setProblem(e.message) };
  const budget = useMutation({ ...trpc.estimate.setBudget.mutationOptions(), ...on });
  const line = useMutation({ ...trpc.estimate.setLine.mutationOptions(), ...on });
  const style = useMutation({ ...trpc.estimate.setStyle.mutationOptions(), ...on });
  const nights = useMutation({ ...trpc.estimate.setNights.mutationOptions(), ...on });
  const home = useMutation({ ...trpc.estimate.setSettings.mutationOptions(), ...on });
  const busy = [budget, line, style, nights, home].some((m) => m.isPending);

  if (estimate.isPending) return <Loading />;
  if (estimate.isError) return <Failed onRetry={() => estimate.refetch()} />;
  const view = estimate.data.view;
  if (!view) return <Lock />;

  const parsed = (raw: string): number | null | undefined => {
    if (!raw.trim()) return null;
    try {
      return parseMoney(raw, view.currency);
    } catch {
      setProblem("Enter an amount, such as 450.");
      return undefined;
    }
  };
  const typed = (raw: string, save: (v: number | null) => void) => {
    const v = parsed(raw);
    if (v !== undefined) save(v);
  };
  const act: Actions = {
    budget: (raw) => typed(raw, (v) => budget.mutate({ tripId, amountMinor: v })),
    line: (l, figure, budget) => {
      const [f, b] = [parsed(figure), parsed(budget)];
      if (f !== undefined && b !== undefined) line.mutate({ tripId, line: l, figure: f, budget: b });
    },
    style: (s) => style.mutate({ tripId, style: s && { cabin: s.cabin, stay: s.stay, pace: s.pace } }),
    nights: (n) => nights.mutate({ tripId, nights: n }),
    home: (code) => home.mutate({ homeAirport: code }),
  };
  const title = edit?.kind === "line" ? LINE_LABELS[edit.line] : edit ? TITLE[edit.kind] : "";

  return (
    <>
      <BudgetView view={view} onEdit={setEdit} />
      <EventSheet open={edit !== null} title={title} onClose={close}>
        {problem ? <Body tone="red">{problem}</Body> : null}
        {edit ? <SheetBody edit={edit} view={view} airport={settings.data?.homeAirport ?? null} busy={busy} act={act} /> : null}
      </EventSheet>
    </>
  );
}
