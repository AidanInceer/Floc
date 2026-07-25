import { useStore } from "../store";
import { monthLabels, gbp } from "../domain/money";
import { Register, NumberField, SelectField } from "./ui";

export function Plan() {
  const { state, setPlan, addOneOff, updateOneOff, removeOneOff, forecast } = useStore();
  const p = state.plan;
  const labels = monthLabels(p.startMonth, p.startYear, p.horizon);
  const months = labels.map((l, i) => ({ value: i + 1, label: l }));
  const breached = forecast.trough.amount < state.profile.bufferFloor;

  return (
    <>
      <header className="masthead">
        <div className="masthead-text">
          <span className="eyebrow">Inputs · {labels[0]} to {labels[labels.length - 1]}</span>
          <h1 className="display display-l">Plan &amp; inputs</h1>
          <p>
            Every figure here feeds the forecast. Change one and the horizon
            recalculates immediately.
          </p>
        </div>
        <div className="masthead-aside">
          <span className={`tag ${breached ? "is-risk" : "is-grow"}`}>
            Tightest {gbp(forecast.trough.amount)} · {forecast.trough.label}
          </span>
        </div>
      </header>

      <Register label="Income" note="Net of tax and pension — what actually lands in the account." title="Income and living">
        <div className="fields">
          <NumberField label="Monthly take-home (£)" value={p.takeHome} onChange={(v) => setPlan({ takeHome: v })} />
          <NumberField label="Card and everyday spend (£)" value={p.cardSpend} onChange={(v) => setPlan({ cardSpend: v })} />
          <NumberField label="Bonus, net (£)" value={p.bonusNet} onChange={(v) => setPlan({ bonusNet: v })} />
          <SelectField
            label="Bonus lands in"
            value={p.bonusMonth}
            onChange={(v) => setPlan({ bonusMonth: v })}
            options={[{ value: 0, label: "No bonus" }, ...months]}
          />
        </div>
      </Register>

      <Register
        label="Housing"
        note="Rent applies until completion; your housing share applies from it."
        title="Housing"
      >
        <div className="fields">
          <NumberField label="Rent until you move (£)" value={p.rent} onChange={(v) => setPlan({ rent: v })} />
          <NumberField
            label="Your housing share, monthly (£)"
            value={p.housingMonthly}
            onChange={(v) => setPlan({ housingMonthly: v })}
            hint="Mortgage, council tax and bills, at your share"
          />
          <SelectField
            label="Completion month"
            value={p.completionMonth}
            onChange={(v) => setPlan({ completionMonth: v })}
            options={months}
            hint="Rent stops and housing costs start"
          />
        </div>
      </Register>

      <Register
        label="Saving"
        note="Surplus above the ceiling is invested rather than left sitting as idle cash."
        title="Saving and investing"
      >
        <div className="fields">
          <NumberField label="Stocks & shares ISA, monthly (£)" value={p.isaMonthly} onChange={(v) => setPlan({ isaMonthly: v })} />
          <SelectField
            label="Contributions start"
            value={p.isaStartMonth}
            onChange={(v) => setPlan({ isaStartMonth: v })}
            options={months}
          />
          <NumberField
            label="Cash buffer ceiling (£)"
            value={p.bufferCeiling}
            onChange={(v) => setPlan({ bufferCeiling: v })}
            hint="Spending cash above this is swept into the ISA"
          />
        </div>
      </Register>

      <Register
        label="One-offs"
        note="Large, dated costs that do not repeat — furniture, moving, holidays."
        title="One-off costs"
        aside={
          <button
            className="btn btn-small"
            onClick={() => addOneOff({ month: 1, amount: 0, label: "New one-off" })}
          >
            Add a one-off
          </button>
        }
      >
        {p.oneOffs.length === 0 ? (
          <p className="empty">Nothing scheduled. Add the costs you already know are coming.</p>
        ) : (
          <div className="ledger">
            {p.oneOffs.map((o) => (
              <div className="line" key={o.id}>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  value={o.label}
                  aria-label="One-off description"
                  onChange={(e) => updateOneOff(o.id, { label: e.target.value })}
                />
                <select
                  className="input"
                  style={{ width: 110 }}
                  value={o.month}
                  aria-label={`Month for ${o.label}`}
                  onChange={(e) => updateOneOff(o.id, { month: parseInt(e.target.value, 10) })}
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <input
                  className="input is-num"
                  type="number"
                  style={{ width: 110 }}
                  value={o.amount}
                  aria-label={`Amount for ${o.label}`}
                  onChange={(e) => updateOneOff(o.id, { amount: parseFloat(e.target.value || "0") })}
                />
                <button
                  className="btn btn-small btn-danger"
                  aria-label={`Remove ${o.label}`}
                  onClick={() => removeOneOff(o.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </Register>

      <p className="disclaimer">
        The cash-sweep rule mirrors the source model: once spending cash would exceed
        the buffer ceiling, the excess tops up that month's ISA contribution instead
        of piling up as idle cash.
      </p>
    </>
  );
}
