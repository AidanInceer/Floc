// Deterministic advice rubrics over the domain state. Each returns a status +
// a plain-language, sourced explanation. The "narrative" layer (Claude) is
// out of scope for the prototype — these messages stand in for it.

import type { Account, Plan, Profile } from "./types";
import type { Forecast } from "./forecast";
import { gbp } from "./money";

export type RubricStatus = "good" | "warn" | "info";

export interface RubricResult {
  id: string;
  status: RubricStatus;
  title: string;
  detail: string;
  source: string;
}

const ISA_ALLOWANCE = 20000; // UK 2026/27 (placeholder — real value belongs in the knowledge base)

export function runRubrics(
  accounts: Account[],
  plan: Plan,
  profile: Profile,
  forecast: Forecast,
): RubricResult[] {
  const results: RubricResult[] = [];

  const ringfenced = accounts
    .filter((a) => a.ringfenced)
    .reduce((s, a) => s + a.balance, 0);
  const essentialMonthly = plan.housingMonthly + plan.cardSpend;
  const emergencyTarget = profile.emergencyMonths * essentialMonthly;

  // 1. Emergency fund
  if (ringfenced >= emergencyTarget) {
    results.push({
      id: "emergency",
      status: "good",
      title: "Emergency fund is on target",
      detail: `Your ring-fenced ${gbp(ringfenced)} covers your ${profile.emergencyMonths}-month target (${gbp(emergencyTarget)} of essentials).`,
      source: "Rubric: emergency-fund · target from your risk profile",
    });
  } else {
    const months = essentialMonthly > 0 ? ringfenced / essentialMonthly : 0;
    results.push({
      id: "emergency",
      status: "warn",
      title: "Emergency fund is under target",
      detail: `Your ring-fenced ${gbp(ringfenced)} covers about ${months.toFixed(1)} months of essentials; your ${profile.risk} profile targets ${profile.emergencyMonths} (${gbp(emergencyTarget)}). Consider topping up ${gbp(emergencyTarget - ringfenced)} before increasing investments.`,
      source: "Rubric: emergency-fund · target from your risk profile",
    });
  }

  // 2. Cash buffer across the horizon
  if (forecast.trough.amount >= profile.bufferFloor) {
    results.push({
      id: "buffer",
      status: "good",
      title: "You stay above your buffer all year",
      detail: `Spending cash bottoms out at ${gbp(forecast.trough.amount)} in ${forecast.trough.label} — above your ${gbp(profile.bufferFloor)} floor. ${forecast.trough.label} is your tightest month.`,
      source: "Rubric: cash-buffer · cash-flow engine",
    });
  } else {
    results.push({
      id: "buffer",
      status: "warn",
      title: "You dip below your buffer",
      detail: `Spending cash falls to ${gbp(forecast.trough.amount)} in ${forecast.trough.label}, under your ${gbp(profile.bufferFloor)} floor. Trim a one-off or shift it to a stronger month.`,
      source: "Rubric: cash-buffer · cash-flow engine",
    });
  }

  // 3. Runway
  if (forecast.runway !== null) {
    results.push({
      id: "runway",
      status: "warn",
      title: "Spending cash runs out within the horizon",
      detail: `On the current plan, spending cash reaches zero by month ${forecast.runway} (${forecast.rows[forecast.runway - 1].label}). Something needs to change before then.`,
      source: "Rubric: runway · cash-flow engine",
    });
  }

  // 4. ISA allowance headroom
  const annualIsa = forecast.rows.reduce((s, r) => s + r.isa, 0);
  const isaStatus: RubricStatus = annualIsa > ISA_ALLOWANCE ? "warn" : "info";
  results.push({
    id: "isa",
    status: isaStatus,
    title:
      annualIsa > ISA_ALLOWANCE
        ? "You may exceed the ISA allowance"
        : "You have ISA allowance headroom",
    detail:
      annualIsa > ISA_ALLOWANCE
        ? `Projected contributions of ${gbp(annualIsa)} exceed the ${gbp(ISA_ALLOWANCE)} annual allowance. Some contributions may need another home.`
        : `Projected contributions of ${gbp(annualIsa)} sit inside the ${gbp(ISA_ALLOWANCE)} annual allowance — ${gbp(ISA_ALLOWANCE - annualIsa)} of headroom.`,
    source: "Source: gov.uk ISA allowance (placeholder) · knowledge base",
  });

  return results;
}
