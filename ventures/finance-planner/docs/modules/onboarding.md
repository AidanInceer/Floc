# Module: Onboarding

**Goal:** get a user from sign-up to a **useful cash-flow forecast in minutes**,
not hours. Low friction is a core product feature — the Excel model's biggest
flaw is that it demands hours of manual input.

## Design principle: minimal input, maximal insight

Every required field is a tax on adoption. For each thing we might ask:

1. Can we **derive** it from bank data? → derive it.
2. Can we **default** it sensibly and let the user correct later? → default it.
3. Only if neither → ask, and ask once, in plain language.

## Happy path (target)

1. **Sign up + 2FA** (unavoidable, kept minimal).
2. **Connect one bank** → transactions + balances flow in. This alone populates
   most of the picture.
3. **Confirm auto-detected recurring items** — we detect salary, rent/mortgage,
   subscriptions and present them for a quick yes/no/edit, pre-filled.
4. **Set risk profile** — a single simple control (cautious/balanced/adventurous)
   that seeds emergency-fund target and buffer threshold with defaults.
5. **See the forecast.** Done. Everything else is optional.

## Progressive disclosure (optional, later)

Only surfaced when relevant, never blocking the first forecast:

- Ring-fenced pots (emergency fund, gifts) — flag an account as ring-fenced.
- Known one-offs (e.g. a furniture budget, a house completion).
- Shared costs and share factors.
- Manual/off-platform assets (crypto, ISAs elsewhere).

## Smart defaults sourced from data

| Input | Instead of asking… | Derive / default |
|---|---|---|
| Monthly income | "What's your salary?" | Detect recurring credit (salary). |
| Essential outgoings | itemising bills | Detect recurring debits + category = essential. |
| Card/everyday spend | "How much do you spend?" | Rolling average of discretionary debits. |
| Emergency-fund target | "How many months?" | Default from risk profile (e.g. 3/6 months). |
| Buffer threshold | a number | Default to ~1 month essentials; editable. |

## Anti-goals

- No 100-field forms.
- No blocking the first forecast on optional data.
- No asking for anything the bank feed already knows.

## Metrics

- Time from sign-up → first forecast (target: < ~15 min).
- Number of required manual fields (target: minimise; track over time).
- Drop-off per onboarding step.

## Open questions

- Best UX for confirming detected recurring items in bulk.
- How much to pre-compute before vs after the risk-profile step.
