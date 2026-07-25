// Domain types for the prototype.
//
// PROTOTYPE SHORTCUT: money is a plain `number` (pounds) here for readability.
// Production must use integer minor units / Decimal — see the venture CLAUDE.md
// ("money is never a float"). This is throwaway code.

export type AccountType =
  | "current"
  | "savings"
  | "isa_cash"
  | "isa_stocks"
  | "crypto"
  | "credit"
  | "other";

export interface Account {
  id: string;
  institution: string;
  name: string;
  type: AccountType;
  balance: number; // pounds; credit balances are stored negative (money owed)
  spendable: boolean; // counts toward day-to-day "spending cash"
  ringfenced: boolean; // hard limit, excluded from spending cash (emergency fund, gifts)
}

export interface OneOff {
  id: string;
  month: number; // 1..horizon
  amount: number; // pounds out of spending cash
  label: string;
}

export interface Plan {
  startMonth: number; // 0=Jan .. 11=Dec, of the horizon's first month
  startYear: number;
  horizon: number; // months

  takeHome: number; // monthly net income
  bonusNet: number; // one-off net bonus
  bonusMonth: number; // 1..horizon (0 = none)

  rent: number; // monthly, until completion
  completionMonth: number; // month rent stops & housing starts (1..horizon)
  housingMonthly: number; // your share of all housing costs once moved in

  cardSpend: number; // everyday/card spend per month

  isaMonthly: number; // base S&S ISA contribution
  isaStartMonth: number; // 1..horizon

  bufferCeiling: number; // sweep spending cash above this into the ISA

  oneOffs: OneOff[];
}

export type Risk = "cautious" | "balanced" | "adventurous";

export interface Profile {
  name: string;
  risk: Risk;
  emergencyMonths: number; // target emergency fund = this * essential monthly spend
  bufferFloor: number; // spending cash should never drop below this
}

export interface AppState {
  onboarded: boolean;
  profile: Profile;
  accounts: Account[];
  plan: Plan;
}
