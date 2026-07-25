// Layout primitives.
//
// `Register` is the one that matters: every section on every page is a register
// — an eyebrow and its note in the left margin, the data in the body. Using it
// consistently is what keeps the pages feeling like one document rather than a
// collection of panels.

import type { ReactNode } from "react";
import type { Account } from "../domain/types";

export function Register({
  label,
  note,
  aside,
  title,
  children,
}: {
  label: string;
  note?: ReactNode;
  aside?: ReactNode;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="register">
      <div className="register-margin">
        <span className="eyebrow">{label}</span>
        {note && <div className="note">{note}</div>}
      </div>
      <div className="register-body">
        {(title || aside) && (
          <div className="register-head">
            {title ? <h2>{title}</h2> : <span />}
            {aside}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/** Money state → the semantic colour and label used everywhere for an account. */
export type MoneyState = "spend" | "held" | "grow" | "other";

export function moneyState(account: Account): MoneyState {
  if (account.ringfenced) return "held";
  if (account.type === "isa_stocks" || account.type === "isa_cash") return "grow";
  if (account.spendable) return "spend";
  return "other";
}

export const STATE_LABEL: Record<MoneyState, string> = {
  spend: "Spendable",
  held: "Ring-fenced",
  grow: "Invested",
  other: "Reserved",
};

export function Figures({ children }: { children: ReactNode }) {
  return <div className="figures">{children}</div>;
}

export function Figure({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "risk" | "grow" | "held";
}) {
  return (
    <div className="figure">
      <div className="figure-label">{label}</div>
      <div className={`figure-value ${tone ? `is-${tone}` : ""}`}>{value}</div>
      {note && <div className="figure-note">{note}</div>}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  step?: number;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        className="input is-num"
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value === "" ? "0" : e.target.value))}
      />
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  hint?: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
