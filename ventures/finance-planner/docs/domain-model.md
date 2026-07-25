# Domain model

Derived from the existing Excel forecaster
(`Hertford_Mill_Financial_Dashboard.xlsx`) and generalised. This is the
vocabulary the whole system shares. Types below are illustrative TypeScript for
`services/domain` — not yet implemented.

## Money rule

Money is **integer minor units + currency**, never a float.

```ts
type Money = { minorUnits: number; currency: "GBP" };  // e.g. 573100_00 pence? No:
// Convention: minorUnits = pence. £575,250.00 => { minorUnits: 57525000, currency: "GBP" }
```

## Core entities

### Account
A financial account, real (bank, via open banking) or manual (crypto wallet, ISA).

```ts
interface Account {
  id: string;
  userId: string;
  provider: "gocardless" | "truelayer" | "manual";
  institution: string;          // "Barclays", "Monzo", "Coinbase"
  displayName: string;          // "Barclays current"
  type: "current" | "savings" | "isa_cash" | "isa_stocks" | "crypto" | "credit" | "other";
  currency: "GBP";
  // Classification flags — lifted straight from the Excel model:
  spendable: boolean;           // counts toward "spending cash"?
  ringfenced: boolean;          // hard limit, never drawn down (e.g. emergency fund, parental gift)
}
```

The Excel distinguishes **spendable cash** from **ring-fenced** money (parental
gift, emergency fund) and from **ISAs** that fund a purchase but aren't day-to-day
spending. That distinction is first-class here via `spendable` / `ringfenced`.

### Balance
A point-in-time balance for an account.

```ts
interface Balance { accountId: string; asOf: string; amount: Money; }
```

### Transaction (canonical)
Provider-agnostic normalised transaction — the atom of everything downstream.

```ts
interface Transaction {
  id: string;
  accountId: string;
  bookedAt: string;             // ISO date
  amount: Money;                // signed: negative = money out
  description: string;
  merchant?: string;
  category?: CategoryId;        // assigned by categorisation
  cadence?: "one_off" | "recurring";
  recurrenceId?: string;        // links instances of the same recurring item
  source: "open_banking" | "manual";
}
```

### Category
Hierarchical, with an essential/discretionary flag (the Excel splits "essential
housing costs" from "general spending").

```ts
interface Category { id: CategoryId; name: string; parentId?: CategoryId; kind: "essential" | "discretionary" | "income" | "transfer"; }
```

### RecurringItem
The backbone of forecasting — detected from transactions or entered manually.

```ts
interface RecurringItem {
  id: string;
  label: string;                // "Salary", "Mortgage (your share)", "Council tax"
  amount: Money;
  cadence: "monthly" | "annual" | "weekly";
  direction: "in" | "out";
  categoryId: CategoryId;
  shareFactor?: number;         // e.g. 0.65 — "your share" of a shared cost (from the Excel)
  startsMonth?: number;         // when it begins in the horizon
  endsMonth?: number;           // when it stops (e.g. old rent stops at completion)
}
```

### OneOff
A known future non-recurring event (furniture spend, bonus, house completion).

```ts
interface OneOff { id: string; label: string; amount: Money; month: number; fundedFrom: "spending_cash" | "cash_isa" | "ss_isa"; }
```

### RiskProfile
Drives the rubrics (buffer sizes, aggressiveness).

```ts
interface RiskProfile { emergencyFundMonths: number; cashBufferThreshold: Money; investmentAppetite: "cautious" | "balanced" | "adventurous"; }
```

## The forecast (generalised Excel `Cashflow` tab)

A projection over a horizon (default 12 months) that, per month, computes:

- Income (recurring in + one-off in, e.g. the April bonus net of tax).
- Essential housing costs, broken out and **share-adjusted** (`shareFactor`).
- General spending (recurring discretionary + card average).
- One-offs (funded from the right pot).
- ISA / savings contributions, including a **cash-sweep** rule (sweep spending
  cash above `cashBufferThreshold` into investments).
- Running balances: **spending cash (closing)**, cash-ISA remaining, investment
  balance.

Key outputs the UI surfaces (all present in the Excel):

- **Lowest point** in the horizon (the trough / runway warning).
- Spending cash at N months out.
- Cash-ISA left over at end.
- Investment balance at end.

```ts
interface ForecastMonth {
  month: string;                // "Dec-26"
  income: Money;
  essentialOutgoings: Money;
  discretionaryOutgoings: Money;
  oneOffs: Money;
  savingsContribution: Money;
  netForMonth: Money;
  spendingCashClosing: Money;
  investmentBalance: Money;
}

interface ForecastResult {
  months: ForecastMonth[];
  lowestSpendingCash: { month: string; amount: Money };
  runwayMonths: number | null;  // null = never runs out in horizon
}
```

## Long-run projection

The Excel projects the investment (S&S ISA) balance forward at lower/upper
growth-rate bounds with continuing contributions. Generalise as:

```ts
interface GrowthProjection { years: number; contributionPerMonth: Money; lowerRate: number; upperRate: number; }
// → balances at 1/3/5/10/15/20/25/30 years, lower & upper bound.
```

Always caveated as illustrative, not a forecast/guarantee.

## Rubrics (advice inputs)

Declarative checks over the domain state, e.g.:

- *Emergency fund*: is ring-fenced cash ≥ `emergencyFundMonths` × essential monthly spend?
- *Buffer*: does spending cash stay above threshold across the horizon?
- *Order of savings*: high-interest debt → emergency fund → tax-advantaged investing.
- *Allowance awareness*: ISA £20k/yr cap, personal allowance, etc. (from knowledge base).

Each rubric returns a pass/fail/deficit + a human-readable, sourced explanation
for the advice engine to narrate.
