import { isFlying } from "@floc/core/money/estimate/plan";
import { ESTIMATE_LOCK_BODY, ESTIMATE_LOCK_TITLE } from "@floc/core/money/estimate/words";
import type { EstimateView } from "@floc/core/money/estimate/view";
import { parseMoney } from "@floc/core/money/money";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";

import { EventSheet } from "@/components/days/event-sheet";
import { Body, Button, Card, Failed, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";

import { AirportForm, AmountForm, NightsForm, StyleForm } from "./budget-forms";
import type { LineActions, Report } from "./budget-line";
import { BudgetView, type BudgetEdit } from "./budget-view";

function Lock() {
  const router = useRouter();
  return (
    <Card>
      <Body bold>{ESTIMATE_LOCK_TITLE}</Body>
      <Body tone="ink-2">{ESTIMATE_LOCK_BODY}</Body>
      <Button label="See Floc Pro" variant="quiet" fit="small" onPress={() => router.push({ pathname: "/settings", params: { pro: "1" } })} />
    </Card>
  );
}

type Actions = {
  budget: (raw: string) => void;
  style: (style: EstimateView["style"] | null) => void;
  nights: (nights: number) => void;
  home: (code: string | null) => void;
};

const TITLE: Record<BudgetEdit["kind"], string> = {
  budget: "Your budget",
  style: "How you travel on this trip",
  home: "Where do you fly from?",
  nights: "How many nights?",
};

function SheetBody({ edit, view, airport, busy, act }: { edit: BudgetEdit; view: EstimateView; airport: string | null; busy: boolean; act: Actions }) {
  switch (edit.kind) {
    case "budget":
      return <AmountForm initial={view.plan.budget} currency={view.currency} label={`For the whole trip, ${view.currency}`} hint="Only you see it." busy={busy} onSave={act.budget} />;
    case "style":
      return <StyleForm style={view.style} flying={isFlying(view.plan)} busy={busy} onSave={act.style} onReset={() => act.style(null)} />;
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
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: trpc.estimate.view.queryKey({ tripId }) });
    void queryClient.invalidateQueries({ queryKey: trpc.estimate.settings.queryKey() });
  };
  const done = () => {
    close();
    refresh();
  };
  const on = { onSuccess: done, onError: (e: { message: string }) => setProblem(e.message) };
  const budget = useMutation({ ...trpc.estimate.setBudget.mutationOptions(), ...on });
  const line = useMutation({ ...trpc.estimate.setLine.mutationOptions(), onSuccess: refresh });
  const travel = useMutation({ ...trpc.estimate.setTravel.mutationOptions(), onSuccess: refresh });
  const style = useMutation({ ...trpc.estimate.setStyle.mutationOptions(), ...on });
  const nights = useMutation({ ...trpc.estimate.setNights.mutationOptions(), ...on });
  const home = useMutation({ ...trpc.estimate.setSettings.mutationOptions(), ...on });
  const busy = [budget, style, nights, home].some((m) => m.isPending);

  if (estimate.isPending) return <Loading />;
  if (estimate.isError) return <Failed onRetry={() => estimate.refetch()} />;
  const view = estimate.data.view;
  if (!view) return <Lock />;

  const parsed = (raw: string): number | null | undefined => {
    if (!raw.trim()) return null;
    try {
      return parseMoney(raw, view.currency);
    } catch {
      return undefined;
    }
  };
  const typed = (raw: string, save: (v: number | null) => void, fail: (problem: string) => void = setProblem) => {
    const v = parsed(raw);
    if (v === undefined) fail("Enter an amount, such as 450.");
    else save(v);
  };
  const settle = (saving: Promise<unknown>, report: Report) => {
    void saving.then(() => report(null), (e: { message: string }) => report(e.message));
  };
  const act: Actions = {
    budget: (raw) => typed(raw, (v) => budget.mutate({ tripId, amountMinor: v })),
    style: (s) => style.mutate({ tripId, style: s && { cabin: s.cabin, stay: s.stay, pace: s.pace } }),
    nights: (n) => nights.mutate({ tripId, nights: n }),
    home: (code) => home.mutate({ homeAirport: code }),
  };
  const lineAct: LineActions = {
    amount: (l, field, raw, report) => typed(raw, (v) => settle(line.mutateAsync({ tripId, line: l, ...(field === "figure" ? { figure: v } : { budget: v }) }), report), report),
    needed: (l, needed, report) => settle(line.mutateAsync({ tripId, line: l, notNeeded: !needed }), report),
    travel: (mode, report) => settle(travel.mutateAsync({ tripId, travel: mode }), report),
  };

  return (
    <>
      <BudgetView view={view} act={lineAct} onEdit={setEdit} />
      <EventSheet open={edit !== null} title={edit ? TITLE[edit.kind] : ""} onClose={close}>
        {problem ? <Body tone="red">{problem}</Body> : null}
        {edit ? <SheetBody edit={edit} view={view} airport={settings.data?.homeAirport ?? null} busy={busy} act={act} /> : null}
      </EventSheet>
    </>
  );
}
