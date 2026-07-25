import { useStore } from "../store";
import { openingSpendingCash, openingInvested } from "../domain/forecast";
import { gbp } from "../domain/money";
import { Register, Figures, Figure, moneyState, STATE_LABEL } from "./ui";
import { HorizonRibbon } from "./Chart";

export function Dashboard({ go }: { go: (tab: string) => void }) {
  const { state, forecast, rubrics } = useStore();
  const { accounts, profile } = state;

  const spending = openingSpendingCash(accounts);
  const netWorth = accounts.reduce((s, a) => s + a.balance, 0);
  const invested = openingInvested(accounts);
  const avgSpare = forecast.rows.reduce((s, r) => s + r.net, 0) / forecast.rows.length;
  const breached = forecast.trough.amount < profile.bufferFloor;

  const findings = [...rubrics]
    .sort((a, b) => weight(b.status) - weight(a.status))
    .slice(0, 2);

  const last = forecast.rows[forecast.rows.length - 1];

  return (
    <>
      <header className="masthead">
        <div className="masthead-text">
          <span className="eyebrow">Position · {forecast.rows[0].label}</span>
          <h1 className="display display-l">Where you stand, {profile.name}</h1>
          <p>
            {breached
              ? `Spending cash falls under your ${gbp(profile.bufferFloor)} floor before the year is out.`
              : `Spending cash stays above your ${gbp(profile.bufferFloor)} floor all the way through.`}
          </p>
        </div>
        <div className="masthead-aside">
          <button className="btn" onClick={() => go("plan")}>
            Edit the plan
          </button>
        </div>
      </header>

      <Register
        label="Today"
        note="Spendable balances only. Ring-fenced money and ISAs are held back."
      >
        <Figures>
          <Figure
            label="Spending cash"
            value={gbp(spending)}
            note={`Across ${accounts.filter((a) => a.spendable && !a.ringfenced).length} accounts`}
          />
          <Figure label="Net worth" value={gbp(netWorth)} note={`${accounts.length} accounts in total`} />
          <Figure
            label="Tightest month"
            value={gbp(forecast.trough.amount)}
            note={forecast.trough.label}
            tone={breached ? "risk" : undefined}
          />
          <Figure
            label="Spare per month"
            value={gbp(Math.round(avgSpare))}
            note={`Invested today ${gbp(invested)}`}
            tone="grow"
          />
        </Figures>
      </Register>

      <Register
        label="The horizon"
        note={`${forecast.rows.length} months of closing spending cash, against your floor.`}
        title="Cash-flow forecast"
        aside={
          <button className="btn btn-quiet btn-small" onClick={() => go("cashflow")}>
            Month by month →
          </button>
        }
      >
        <HorizonRibbon forecast={forecast} bufferFloor={profile.bufferFloor} compact />
      </Register>

      <Register
        label="Accounts"
        note="The colour bar marks what each balance is for."
        title="Where the money is"
        aside={
          <button className="btn btn-quiet btn-small" onClick={() => go("accounts")}>
            Edit accounts →
          </button>
        }
      >
        <div className="ledger">
          {accounts.map((a) => {
            const s = moneyState(a);
            return (
              <div className="line" key={a.id}>
                <span className={`state-bar is-${s}`} aria-hidden="true" />
                <div className="line-grow">
                  <div className="line-title">
                    {a.institution} · {a.name}
                  </div>
                  <div className="line-sub">{STATE_LABEL[s]}</div>
                </div>
                <div className={`line-amount num ${a.balance < 0 ? "is-neg" : ""}`}>
                  {gbp(a.balance)}
                </div>
              </div>
            );
          })}
        </div>
      </Register>

      <Register
        label="Findings"
        note="Ranked by what needs attention first."
        title="Guidance"
        aside={
          <button className="btn btn-quiet btn-small" onClick={() => go("guidance")}>
            All findings →
          </button>
        }
      >
        {findings.map((r) => (
          <div className={`finding is-${r.status}`} key={r.id}>
            <div className="finding-glyph">{glyph(r.status)}</div>
            <div>
              <h3>{r.title}</h3>
              <p>{r.detail}</p>
            </div>
          </div>
        ))}
      </Register>

      <Register label="At the end" note={`Where the plan lands by ${last.label}.`}>
        <div className="ledger">
          <div className="line">
            <div className="line-grow line-title">Spending cash</div>
            <div className="line-amount num">{gbp(forecast.endSpending)}</div>
          </div>
          <div className="line">
            <div className="line-grow line-title">Invested (stocks &amp; shares ISA)</div>
            <div className="line-amount num">{gbp(forecast.endIsa)}</div>
          </div>
          <div className="line">
            <div className="line-grow line-title">Total income over the horizon</div>
            <div className="line-amount num">{gbp(forecast.totalIn)}</div>
          </div>
          <div className="line">
            <div className="line-grow line-title">Runway</div>
            <div className="line-amount num">
              {forecast.runway ? `${forecast.runway} months` : `${forecast.rows.length}+ months`}
            </div>
          </div>
        </div>
      </Register>

      <p className="disclaimer">
        Prototype · informational only, not regulated financial advice. Figures are
        illustrative and seeded from a worked example.
      </p>
    </>
  );
}

function weight(status: string) {
  return status === "warn" ? 2 : status === "info" ? 1 : 0;
}

export function glyph(status: string) {
  return status === "good" ? "✓" : status === "warn" ? "!" : "·";
}
