import { useStore } from "../store";
import { growthProjection } from "../domain/forecast";
import { gbp, signed } from "../domain/money";
import { Register, Figures, Figure } from "./ui";
import { HorizonRibbon } from "./Chart";

export function Cashflow() {
  const { state, forecast } = useStore();
  const { plan, profile } = state;

  const half = Math.min(5, forecast.rows.length - 1);
  const projection = growthProjection(forecast.endIsa, plan.isaMonthly, [1, 5, 10, 20, 30], 0.04, 0.08);
  const breached = forecast.trough.amount < profile.bufferFloor;

  return (
    <>
      <header className="masthead">
        <div className="masthead-text">
          <span className="eyebrow">Horizon · {forecast.rows.length} months</span>
          <h1 className="display display-l">Cash-flow forecast</h1>
          <p>
            Spending cash projected month by month, after housing, living costs,
            one-offs and ISA contributions. Change any input on the plan page.
          </p>
        </div>
      </header>

      <Register label="Summary" note="Closing spending cash at four points in the horizon.">
        <Figures>
          <Figure
            label="Tightest month"
            value={gbp(forecast.trough.amount)}
            note={forecast.trough.label}
            tone={breached ? "risk" : undefined}
          />
          <Figure
            label="Runway"
            value={forecast.runway ? `${forecast.runway} mo` : `${forecast.rows.length}+ mo`}
            note={forecast.runway ? "reaches zero" : "never reaches zero in horizon"}
            tone={forecast.runway ? "risk" : "grow"}
          />
          <Figure
            label={`Month ${half + 1}`}
            value={gbp(forecast.rows[half].spendingClosing)}
            note={forecast.rows[half].label}
          />
          <Figure
            label="At the end"
            value={gbp(forecast.endSpending)}
            note={forecast.rows[forecast.rows.length - 1].label}
          />
        </Figures>
      </Register>

      <Register
        label="The horizon"
        note="Ring-fenced funds and ISA balances are excluded — this is money you could actually spend."
      >
        <HorizonRibbon forecast={forecast} bufferFloor={profile.bufferFloor} />
      </Register>

      <Register
        label="Month by month"
        note="Housing is shown at your share. The cash sweep appears inside the ISA column."
        title="Full schedule"
        aside={<span className="tag">{forecast.rows.length} months</span>}
      >
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Housing</th>
                <th>Living</th>
                <th>One-offs</th>
                <th>ISA</th>
                <th>Net</th>
                <th>Spending cash</th>
              </tr>
            </thead>
            <tbody>
              {forecast.rows.map((r) => (
                <tr key={r.i} className={r.i === forecast.trough.i ? "is-trough" : ""}>
                  <td className="is-key">
                    {r.label}
                    {r.i === forecast.trough.i && (
                      <span className="tag is-risk" style={{ marginLeft: 8 }}>
                        low
                      </span>
                    )}
                  </td>
                  <td>{gbp(r.income)}</td>
                  <td>{gbp(r.housing)}</td>
                  <td>{gbp(r.living)}</td>
                  <td>{r.oneOffs ? gbp(r.oneOffs) : "—"}</td>
                  <td>{r.isa ? gbp(r.isa) : "—"}</td>
                  <td className={r.net < 0 ? "is-neg" : r.net > 0 ? "is-pos" : ""}>
                    {r.net === 0 ? gbp(0) : signed(r.net)}
                  </td>
                  <td className="is-total">{gbp(r.spendingClosing)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Register>

      <Register
        label="Long run"
        note={`From ${gbp(forecast.endIsa)} with ${gbp(plan.isaMonthly)} a month continuing.`}
        title="Invested balance, illustrative"
        aside={<span className="tag">4% – 8% a year</span>}
      >
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Years</th>
                <th>At 4% a year</th>
                <th>At 8% a year</th>
              </tr>
            </thead>
            <tbody>
              {projection.map((row) => (
                <tr key={row.year}>
                  <td className="is-key">{row.year}</td>
                  <td>{gbp(row.lower)}</td>
                  <td className="is-pos">{gbp(row.upper)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="disclaimer">
          Illustrative only. Real returns vary year to year and can be negative — this
          is a compounding calculation at two fixed rates, not a forecast or a guarantee.
        </p>
      </Register>
    </>
  );
}
