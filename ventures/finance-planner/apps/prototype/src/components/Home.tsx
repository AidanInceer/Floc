// The front door.
//
// Renders outside the app shell, with its own bar — arriving somewhere should
// feel different from being inside the tool. The hero is not a pitch: it states
// the actual verdict on the actual plan, computed from the same forecast the
// rest of the app uses. If the numbers change, the headline changes.

import { useStore } from "../store";
import { gbp } from "../domain/money";
import { openingSpendingCash } from "../domain/forecast";
import { Register } from "./ui";
import { HorizonRibbon } from "./Chart";

const CAPABILITIES = [
  {
    label: "Accounts",
    title: "Every pot in one register",
    body:
      "Current accounts, savings, ISAs and credit in one place, each marked spendable, ring-fenced or invested. Ring-fenced money is never counted as available.",
  },
  {
    label: "Forecast",
    title: "The next twelve months, monthly",
    body:
      "Income, housing, living costs and one-offs projected forward, with the cash sweep that moves surplus into investing rather than leaving it idle.",
  },
  {
    label: "Guidance",
    title: "Findings you can check",
    body:
      "Deterministic rubrics over your own figures — emergency fund, cash buffer, runway, allowance headroom — each stating the rule it applied.",
  },
];

// A genuine sequence, so it is numbered. Nothing else in the app is.
const STEPS = [
  { n: "01", title: "Set your cushion", body: "Pick how much cover you want before investing. That sets your floor." },
  { n: "02", title: "List your accounts", body: "Enter balances and mark what is actually spendable." },
  { n: "03", title: "Describe the year", body: "Income, rent, the month you move, one-off costs." },
  { n: "04", title: "Read the horizon", body: "See the tightest month before you reach it, and what to change." },
];

export function Home({ go }: { go: (tab: string) => void }) {
  const { state, forecast } = useStore();
  const { profile, accounts } = state;

  const breached = forecast.trough.amount < profile.bufferFloor;
  const runsOut = forecast.runway !== null;
  const spendable = openingSpendingCash(accounts);

  return (
    <div className="home">
      <div className="home-bar">
        <div className="mark" style={{ padding: 0 }}>
          <span className="mark-glyph">₤</span>
          <span className="mark-name">
            Ledger <em>/ financial planning</em>
          </span>
        </div>
        <button className="btn btn-primary" onClick={() => go("overview")}>
          Open the planner
        </button>
      </div>

      <header className="home-hero">
        <span className="eyebrow rise">Horizon · {forecast.rows.length} months from {forecast.rows[0].label}</span>

        <h1 className="thesis rise rise-2">
          {runsOut ? (
            <>
              Your spending cash runs out in{" "}
              <b className="is-risk">{forecast.rows[forecast.runway! - 1].label}</b>.
            </>
          ) : breached ? (
            <>
              Your plan dips below the floor in{" "}
              <b className="is-risk">{forecast.trough.label}</b>, to{" "}
              <b className="is-risk">{gbp(forecast.trough.amount)}</b>.
            </>
          ) : (
            <>
              Your plan holds. The tightest month is <b>{forecast.trough.label}</b>, at{" "}
              <b>{gbp(forecast.trough.amount)}</b>.
            </>
          )}
        </h1>

        <p className="home-lede rise rise-3">
          A planner that works from the money you can actually spend. It separates the{" "}
          {gbp(spendable)} that is genuinely available from the emergency fund and
          the investments, then projects it forward month by month so the tight
          months arrive on a screen instead of a statement.
        </p>

        <div className="home-cta rise rise-4">
          <button className="btn btn-primary" onClick={() => go("overview")}>
            Open the planner
          </button>
          <button className="btn" onClick={() => go("cashflow")}>
            See the full forecast
          </button>
        </div>
      </header>

      <Register
        label="The horizon"
        note="Spending cash, closing balance each month. Ring-fenced funds and ISAs are excluded."
      >
        <HorizonRibbon forecast={forecast} bufferFloor={profile.bufferFloor} />
      </Register>

      <Register label="What it does" note="Three modules, one shared set of figures.">
        <div className="capability">
          {CAPABILITIES.map((c) => (
            <div className="capability-item" key={c.label}>
              <span className="eyebrow">{c.label}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </Register>

      <Register label="Getting there" note="Four steps, in order. Under a minute for the first pass.">
        <div className="capability">
          {STEPS.map((s) => (
            <div className="capability-item" key={s.n}>
              <span className="eyebrow">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </Register>

      <footer className="home-foot">
        Prototype. Figures are seeded from a worked example and stored in a SQLite
        database in your browser. Informational only — not regulated financial advice.
      </footer>
    </div>
  );
}
