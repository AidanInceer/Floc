import { useState } from "react";
import { useStore } from "../store";
import type { AccountType } from "../domain/types";
import { openingSpendingCash } from "../domain/forecast";
import { gbp } from "../domain/money";
import { Register, Figures, Figure, moneyState, STATE_LABEL } from "./ui";

const TYPES: { value: AccountType; label: string }[] = [
  { value: "current", label: "Current" },
  { value: "savings", label: "Savings" },
  { value: "isa_cash", label: "Cash ISA" },
  { value: "isa_stocks", label: "Stocks & shares ISA" },
  { value: "crypto", label: "Crypto" },
  { value: "credit", label: "Credit" },
  { value: "other", label: "Other" },
];

export function Accounts() {
  const { state, addAccount, updateAccount, removeAccount } = useStore();
  const { accounts } = state;
  const [adding, setAdding] = useState(false);

  const spendable = openingSpendingCash(accounts);
  const ringfenced = accounts.filter((a) => a.ringfenced).reduce((s, a) => s + a.balance, 0);
  const isas = accounts.filter((a) => a.type.startsWith("isa")).reduce((s, a) => s + a.balance, 0);

  return (
    <>
      <header className="masthead">
        <div className="masthead-text">
          <span className="eyebrow">Position · {accounts.length} accounts</span>
          <h1 className="display display-l">Accounts</h1>
          <p>
            Everything the forecast draws on. Edit any figure and the horizon
            recalculates as you type.
          </p>
        </div>
        <div className="masthead-aside">
          <button className="btn btn-primary" onClick={() => setAdding((v) => !v)}>
            {adding ? "Cancel" : "Add account"}
          </button>
        </div>
      </header>

      <Register label="Split" note="Only spendable, non-ring-fenced money reaches the forecast.">
        <Figures>
          <Figure label="Spendable" value={gbp(spendable)} note="Day-to-day money" />
          <Figure label="Ring-fenced" value={gbp(ringfenced)} note="Emergency fund and gifts" tone="held" />
          <Figure label="In ISAs" value={gbp(isas)} note="Cash plus stocks & shares" tone="grow" />
        </Figures>
      </Register>

      {adding && (
        <Register label="New" note="Balances owed on credit go in as a negative figure." title="Add an account">
          <AddAccount
            onAdd={(a) => {
              addAccount(a);
              setAdding(false);
            }}
          />
        </Register>
      )}

      <Register
        label="Register"
        note="Ring-fenced marks money you will not spend. Spendable marks money the forecast may draw on."
        title="All accounts"
      >
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Spendable</th>
                <th>Ring-fenced</th>
                <th>State</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const s = moneyState(a);
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className={`state-bar is-${s}`} aria-hidden="true" />
                        <div>
                          <div style={{ fontWeight: 500 }}>{a.institution}</div>
                          <input
                            className="input"
                            style={{ padding: "2px 6px", fontSize: "0.75rem", width: 170, marginTop: 3 }}
                            value={a.name}
                            aria-label={`Name for ${a.institution}`}
                            onChange={(e) => updateAccount(a.id, { name: e.target.value })}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className="input"
                        style={{ padding: "5px 7px", width: 155 }}
                        value={a.type}
                        aria-label={`Type for ${a.institution} ${a.name}`}
                        onChange={(e) => updateAccount(a.id, { type: e.target.value as AccountType })}
                      >
                        {TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="input is-num"
                        type="number"
                        style={{ width: 120 }}
                        value={a.balance}
                        aria-label={`Balance for ${a.institution} ${a.name}`}
                        onChange={(e) => updateAccount(a.id, { balance: parseFloat(e.target.value || "0") })}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={a.spendable}
                        aria-label={`${a.institution} ${a.name} is spendable`}
                        onChange={(e) => updateAccount(a.id, { spendable: e.target.checked })}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={a.ringfenced}
                        aria-label={`${a.institution} ${a.name} is ring-fenced`}
                        onChange={(e) => updateAccount(a.id, { ringfenced: e.target.checked })}
                      />
                    </td>
                    <td>
                      <span className={`tag ${s === "other" ? "" : `is-${s}`}`}>{STATE_LABEL[s]}</span>
                    </td>
                    <td>
                      <button className="btn btn-small btn-danger" onClick={() => removeAccount(a.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Register>

      <p className="disclaimer">
        Spendable, non-ring-fenced balances form your opening spending cash. Stocks
        and shares ISA balances seed the invested projection.
      </p>
    </>
  );
}

function AddAccount({
  onAdd,
}: {
  onAdd: (a: {
    institution: string;
    name: string;
    type: AccountType;
    balance: number;
    spendable: boolean;
    ringfenced: boolean;
  }) => void;
}) {
  const [institution, setInstitution] = useState("");
  const [name, setName] = useState("");
  const [balance, setBalance] = useState(0);
  const [type, setType] = useState<AccountType>("current");
  const [spendable, setSpendable] = useState(true);
  const [ringfenced, setRingfenced] = useState(false);

  return (
    <>
      <div className="fields">
        <div className="field">
          <label htmlFor="new-inst">Institution</label>
          <input
            id="new-inst"
            className="input"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="Monzo"
          />
        </div>
        <div className="field">
          <label htmlFor="new-name">Name</label>
          <input
            id="new-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Savings"
          />
        </div>
        <div className="field">
          <label htmlFor="new-balance">Balance (£)</label>
          <input
            id="new-balance"
            className="input is-num"
            type="number"
            value={balance}
            onChange={(e) => setBalance(parseFloat(e.target.value || "0"))}
          />
        </div>
        <div className="field">
          <label htmlFor="new-type">Type</label>
          <select
            id="new-type"
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 22, margin: "18px 0" }}>
        <label className="check">
          <input type="checkbox" checked={spendable} onChange={(e) => setSpendable(e.target.checked)} />
          Spendable
        </label>
        <label className="check">
          <input type="checkbox" checked={ringfenced} onChange={(e) => setRingfenced(e.target.checked)} />
          Ring-fenced
        </label>
      </div>

      <button
        className="btn btn-primary"
        disabled={!institution}
        onClick={() => onAdd({ institution, name: name || "Account", type, balance, spendable, ringfenced })}
      >
        Add account
      </button>
    </>
  );
}
