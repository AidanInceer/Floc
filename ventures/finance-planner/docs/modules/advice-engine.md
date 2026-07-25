# Module: Advice Engine

**Goal:** turn the numbers into clear, prioritised, **sourced** guidance —
generalised financial coaching, not regulated advice.

## Inputs

- Forecast result (trough, runway, balances) from the cash-flow engine.
- Current balances and pot classification (spendable / ring-fenced / ISA).
- Risk profile.
- Knowledge base (current UK figures) — see [`knowledge-base.md`](knowledge-base.md).

## Two-layer design

### 1. Rubrics (deterministic)

Declarative, versioned rules over domain state. Each returns pass / fail /
deficit + a structured, sourced explanation. Examples:

- **Emergency fund:** ring-fenced cash ≥ `emergencyFundMonths` × essential
  monthly spend? Deficit = shortfall amount.
- **Buffer:** does projected spending cash stay above threshold all horizon?
  Flag the trough month if not.
- **Order of saving:** high-interest debt → emergency fund → tax-advantaged
  investing. Flag if out of order (e.g. investing while carrying costly debt).
- **Allowance awareness:** ISA £20k/yr cap, personal allowance, etc. (figures
  from knowledge base) — flag headroom or over-use.
- **Steps to resilience:** a laddered rubric (buffer → emergency fund →
  clear expensive debt → invest to goals) showing the next concrete step.

Rubrics are the trustworthy backbone: deterministic, testable, explainable.

### 2. Narrative (Claude)

The AI layer **explains and prioritises** rubric outputs in plain language,
tuned to the user's situation and risk appetite. It does **not** invent figures.

- Input to the model: rubric results + relevant knowledge-base facts + a compact
  snapshot of the forecast. Not raw transaction dumps.
- Output: a prioritised, actionable feed with citations to the underlying rubric
  and source (e.g. gov.uk for tax figures).
- Structured output (typed) so the UI renders it reliably.
- Every AI feature ships with a small **eval set** before it's trusted.

## Guardrails

- **Guidance, not regulated advice.** Framed as informational/educational, with
  a persistent disclaimer. No personalised regulated investment recommendations.
- **Always sourced.** Any figure or rule cites its origin (rubric + gov.uk).
- **No hallucinated numbers.** Figures come only from the knowledge base or the
  computed forecast.
- **Least data to the model.** Send the minimum needed.

## Example advice items (illustrative)

- "Your projected spending cash dips to £4,581 in Oct — above your £X buffer, so
  you're covered, but it's your tightest month."
- "Your emergency fund covers ~4 months of essentials; your profile targets 6.
  Consider topping up £Y before increasing investments."
- "You've used £Z of your £20,000 ISA allowance this tax year (source: gov.uk)."

## Open questions

- Prioritisation model for the feed (severity × proximity?).
- How much personalisation before it edges toward "regulated advice".
- Eval design for narrative quality/safety.
