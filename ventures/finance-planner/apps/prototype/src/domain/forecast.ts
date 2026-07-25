// The cash-flow engine — a generalised port of the Excel `Cashflow` tab.
// Deterministic and pure: inputs in, forecast out.
//
// Reproduces the source model's headline behaviour: share-adjusted housing that
// starts at the completion month (rent stops), a bonus month, ISA contributions
// that start mid-horizon, and a cash-sweep that tops spending cash off at a
// buffer ceiling (the excess flows into the S&S ISA).

import type { Account, Plan } from "./types";
import { monthLabels } from "./money";

export interface MonthRow {
  i: number; // 1-based
  label: string;
  income: number;
  housing: number;
  living: number;
  oneOffs: number;
  isa: number; // ISA contribution incl. any sweep top-up
  net: number; // change in spending cash this month
  spendingClosing: number;
  isaBalance: number;
}

export interface Forecast {
  rows: MonthRow[];
  trough: { label: string; amount: number; i: number };
  runway: number | null; // months until spending cash hits 0 (null = never in horizon)
  endSpending: number;
  endIsa: number;
  totalIn: number;
  totalOut: number;
}

/** Opening spending cash = sum of spendable, non-ring-fenced balances. */
export function openingSpendingCash(accounts: Account[]): number {
  return accounts
    .filter((a) => a.spendable && !a.ringfenced)
    .reduce((s, a) => s + a.balance, 0);
}

/** Opening invested (S&S ISA) balance. */
export function openingInvested(accounts: Account[]): number {
  return accounts
    .filter((a) => a.type === "isa_stocks")
    .reduce((s, a) => s + a.balance, 0);
}

export function computeForecast(
  plan: Plan,
  accounts: Account[],
): Forecast {
  const labels = monthLabels(plan.startMonth, plan.startYear, plan.horizon);
  let spending = openingSpendingCash(accounts);
  let isaBalance = openingInvested(accounts);

  const rows: MonthRow[] = [];
  let totalIn = 0;
  let totalOut = 0;

  for (let i = 1; i <= plan.horizon; i++) {
    const income = plan.takeHome + (i === plan.bonusMonth ? plan.bonusNet : 0);

    // Rent applies before completion; your housing share applies from it.
    const housing = i < plan.completionMonth ? plan.rent : plan.housingMonthly;

    const living = plan.cardSpend;

    const oneOffs = plan.oneOffs
      .filter((o) => o.month === i)
      .reduce((s, o) => s + o.amount, 0);

    const isaBase = i >= plan.isaStartMonth ? plan.isaMonthly : 0;

    const preNet = income - housing - living - oneOffs - isaBase;
    let closing = spending + preNet;
    let isa = isaBase;

    // Cash-sweep: keep spending cash at the ceiling, invest the excess.
    if (closing > plan.bufferCeiling) {
      const excess = closing - plan.bufferCeiling;
      isa += excess;
      closing = plan.bufferCeiling;
    }

    const net = closing - spending;
    spending = closing;
    isaBalance += isa;

    totalIn += income;
    totalOut += housing + living + oneOffs + isa;

    rows.push({
      i,
      label: labels[i - 1],
      income,
      housing,
      living,
      oneOffs,
      isa,
      net,
      spendingClosing: closing,
      isaBalance,
    });
  }

  let trough = { label: rows[0].label, amount: rows[0].spendingClosing, i: 1 };
  let runway: number | null = null;
  for (const r of rows) {
    if (r.spendingClosing < trough.amount) {
      trough = { label: r.label, amount: r.spendingClosing, i: r.i };
    }
    if (runway === null && r.spendingClosing <= 0) runway = r.i;
  }

  return {
    rows,
    trough,
    runway,
    endSpending: rows[rows.length - 1].spendingClosing,
    endIsa: rows[rows.length - 1].isaBalance,
    totalIn,
    totalOut,
  };
}

/** Illustrative long-run projection of the invested balance (lower/upper bounds). */
export function growthProjection(
  startBalance: number,
  monthlyContribution: number,
  years: number[],
  lowerRate: number,
  upperRate: number,
) {
  const project = (rate: number, yrs: number) => {
    const m = rate / 12;
    const n = yrs * 12;
    // future value of current balance + future value of a monthly annuity
    const fvBalance = startBalance * Math.pow(1 + m, n);
    const fvContrib =
      m === 0
        ? monthlyContribution * n
        : monthlyContribution * ((Math.pow(1 + m, n) - 1) / m);
    return fvBalance + fvContrib;
  };
  return years.map((y) => ({
    year: y,
    lower: project(lowerRate, y),
    upper: project(upperRate, y),
  }));
}
