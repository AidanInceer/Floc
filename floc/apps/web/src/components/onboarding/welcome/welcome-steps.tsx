"use client";

import { useState } from "react";
import { CURRENCIES, currencyName, type Currency } from "@floc/core/money/currency";
import { CABINS, CABIN_LABELS, PACES, PACE_LABELS, STAY_LABELS, STAY_STYLES } from "@floc/core/money/estimate/style";
import { VIBE_TAGS } from "@floc/core/trip/vibe-tags";

import { AirportField } from "@/components/money/estimate/airport-field";
import { TravelModeIcon } from "@/components/system/icons/travel-mode";
import { VibeIcon } from "@/components/system/icons/vibes";
import { Button, Select } from "@/components/system/ui";
import { ChoiceRow, ChoiceTile, ChoiceWord } from "../choice-tile";
import { StepHead } from "../step-head";

export type Chosen = { code: string; label: string } | null;
export type Style = { cabin?: string; stay?: string; pace?: string };

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function AirportStep({ chosen, onChosen, picks, currency }: { chosen: Chosen; onChosen: (c: Chosen) => void; picks: { code: string; label: string }[]; currency: Currency }) {
  const [changing, setChanging] = useState(false);
  return (
    <>
      <StepHead title="Where do you usually fly from?" tile={<TravelModeIcon mode="flight" size={20} />} tone="blue" />
      <div className="grid gap-3">
        <div className="grid gap-1 [&>div]:!w-full">
          <label htmlFor="welcome-airport" className="typed">Home airport</label>
          <AirportField key={chosen?.code ?? "none"} id="welcome-airport" chosen={chosen} />
        </div>
        {!chosen && picks.length ? (
          <div className="flex flex-wrap gap-1.5">
            {picks.map((p) => (
              <Button key={p.code} type="button" onClick={() => onChosen(p)}>{p.label}</Button>
            ))}
          </div>
        ) : null}
        {changing ? (
          <Select name="currency" defaultValue={currency} aria-label="Home currency">
            {CURRENCIES.map((c) => <option key={c} value={c}>{`${currencyName(c)} (${c})`}</option>)}
          </Select>
        ) : (
          <p className="text-sm text-ink-soft">
            <input type="hidden" name="currency" value={currency} />
            Prices show in {currencyName(currency)} ({currency}).{" "}
            <button type="button" className="text-pen hover:underline" onClick={() => setChanging(true)}>Change</button>
          </p>
        )}
      </div>
    </>
  );
}

export function StyleStep({ style, onStyle }: { style: Style; onStyle: (update: (s: Style) => Style) => void }) {
  const toggle = (key: keyof Style, value: string) => onStyle((now) => ({ ...now, [key]: now[key] === value ? undefined : value }));
  return (
    <>
      <StepHead title="How do you like to travel?" sub="One in each row, or none." />
      <div className="grid gap-3.5">
        <ChoiceRow label="Cabin">{CABINS.map((c) => <ChoiceWord key={c} picked={style.cabin === c} label={CABIN_LABELS[c]} onPick={() => toggle("cabin", c)} />)}</ChoiceRow>
        <ChoiceRow label="Stay">{STAY_STYLES.map((s) => <ChoiceWord key={s} picked={style.stay === s} label={STAY_LABELS[s]} onPick={() => toggle("stay", s)} />)}</ChoiceRow>
        <ChoiceRow label="Pace">{PACES.map((p) => <ChoiceWord key={p} picked={style.pace === p} label={PACE_LABELS[p]} onPick={() => toggle("pace", p)} />)}</ChoiceRow>
      </div>
      {(["cabin", "stay", "pace"] as const).map((k) => (style[k] ? <input key={k} type="hidden" name={k} value={style[k]} /> : null))}
    </>
  );
}

export function VibesStep({ vibes, onVibes }: { vibes: string[]; onVibes: (update: (v: string[]) => string[]) => void }) {
  return (
    <>
      <StepHead title="What are you into?" sub="Pick as many as you like." />
      <div className="flex flex-wrap gap-2">
        {VIBE_TAGS.map((tag) => (
          <ChoiceTile key={tag} picked={vibes.includes(tag)} label={cap(tag)} icon={<VibeIcon tag={tag} size={18} />} onPick={() => onVibes((now) => (now.includes(tag) ? now.filter((v) => v !== tag) : [...now, tag]))} />
        ))}
      </div>
      {vibes.map((v) => <input key={v} type="hidden" name="vibes" value={v} />)}
    </>
  );
}
