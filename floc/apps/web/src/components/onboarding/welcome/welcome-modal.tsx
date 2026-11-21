"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Currency } from "@floc/core/money/currency";
import type { WelcomeAnswers } from "@floc/core/people/welcome/welcome";

import { finishWelcomeForm } from "@/app/welcome/actions";
import { Button } from "@/components/system/ui";
import { FlocMark } from "@/components/system/wordmark";
import { StepFoot } from "../step-dots";
import { StepModal } from "../step-modal";
import { StartTripModal } from "../start/start-trip-modal";
import type { StartPerson } from "../start/start-who";
import { IntroStep, WhereFirst } from "./welcome-ends";
import { AirportStep, StyleStep, VibesStep, type Chosen, type Style } from "./welcome-steps";

export type WelcomeProps = {
  me: string;
  currency: Currency;
  answers: WelcomeAnswers & { airport: Chosen };
  picks: { code: string; label: string }[];
  invited: string | null;
  people: StartPerson[];
};

const LAST = 4;

export function WelcomeModal({ me, currency, answers, picks, invited, people }: WelcomeProps) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(true);
  const [at, setAt] = useState(0);
  const [airport, setAirport] = useState<Chosen>(answers.airport);
  const [style, setStyle] = useState<Style>({ cabin: answers.travelCabin, stay: answers.travelStay, pace: answers.travelPace });
  const [vibes, setVibes] = useState<string[]>(answers.vibeTags ?? []);
  const [starting, setStarting] = useState<string | null>(null);

  const save = async () => {
    setOpen(false);
    await finishWelcomeForm(form.current ? new FormData(form.current) : new FormData());
  };
  const close = () => void save().then(() => router.refresh());

  const left = at === 0 ? <Button type="button" variant="ghost" onClick={() => setAt(LAST)}>Skip for now</Button> : <Button type="button" variant="ghost" onClick={() => setAt(at - 1)}>Back</Button>;
  const right =
    at === 0 ? <Button type="button" variant="primary" onClick={() => setAt(1)}>Let’s go</Button>
    : at === LAST ? <Button type="button" variant="ghost" onClick={close}>Look around</Button>
    : <Button type="button" variant="primary" onClick={() => setAt(at + 1)}>{at === LAST - 1 ? "Done" : "Next"}</Button>;

  return (
    <>
      <StepModal
        open={open}
        label="Welcome to Floc"
        onClose={close}
        corner={at > 0 ? <FlocMark className="h-[17px] w-[22px]" /> : undefined}
        footer={<StepFoot left={left} right={right} dots={at < LAST ? { of: LAST, at } : undefined} />}
      >
        <form ref={form} onSubmit={(event) => event.preventDefault()}>
          <div hidden={at !== 0} className="step-in"><IntroStep invited={invited} /></div>
          <div hidden={at !== 1} className="step-in"><AirportStep chosen={airport} onChosen={setAirport} picks={picks} currency={currency} /></div>
          <div hidden={at !== 2} className="step-in"><StyleStep style={style} onStyle={setStyle} /></div>
          <div hidden={at !== 3} className="step-in"><VibesStep vibes={vibes} onVibes={setVibes} /></div>
        </form>
        {at === LAST ? (
          <div className="step-in">
            <WhereFirst
              me={me}
              invited={invited}
              onStart={(name) => void save().then(() => setStarting(name))}
              onExplore={() => void save().then(() => router.push("/explore"))}
              onOpen={close}
              beforeLink={save}
            />
          </div>
        ) : null}
      </StepModal>
      {starting !== null ? <StartTripModal open onClose={() => { setStarting(null); router.refresh(); }} me={me} people={people} seed={{ name: starting }} /> : null}
    </>
  );
}
