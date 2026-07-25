import { useState } from "react";
import { balances, totalSpent, useStore } from "../store";
import { fmt, parseAmount, settleUp, splitEvenly } from "../money";
import { Who, byId } from "../ui";
import type { Trip } from "../types";

// ADR 0007: a shared ledger, not a payments business. Nothing here holds or
// moves funds — "Mark as settled" writes a line, and the transfer happens in
// whatever app the two of them already use.

export function Money({ trip }: { trip: Trip }) {
  const { state, dispatch } = useStore();
  const me = state.meId;

  const [what, setWhat] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(me);
  const [shares, setShares] = useState<string[]>(trip.members.map((m) => m.id));
  const [err, setErr] = useState("");

  const bal = balances(trip);
  const spent = totalSpent(trip);
  const mine = bal.find((b) => b.memberId === me)?.net ?? 0;
  const transfers = settleUp(bal);
  const myTransfers = transfers.filter((t) => t.from === me || t.to === me);

  function add() {
    const minor = parseAmount(amount);
    if (!what.trim()) return setErr("What was it for?");
    if (minor === null || minor === 0) return setErr("Write the amount as a number — 88.80 or 888.");
    if (!shares.length) return setErr("Somebody has to be paying for it.");
    setErr("");
    dispatch({ type: "addExpense", tripId: trip.id, what: what.trim(), payerId: payer, amountMinor: minor, shareIds: shares });
    setWhat("");
    setAmount("");
  }

  return (
    <div className="sheet">
      <span className="tape r" />
      <div className="two">
        <div className="ruled">
          <span className="typed">{trip.title} · the back pages</span>
          <h2 style={{ fontSize: 25, margin: "4px 0 2px" }}>Who's paid for what</h2>
          <p className="aside-note">
            Every line is who paid and who it was for. Waypoint never touches the money — it just works out the shortest
            way to make everyone square.
          </p>

          <div className="tablewrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>What</th>
                <th>Who paid</th>
                <th className="r">Amount</th>
                <th className="r">Each</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {trip.expenses.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <span className="hand">Nothing spent yet.</span>
                      <p className="aside-note">Add the deposit someone's already put down — that's usually the first one.</p>
                    </div>
                  </td>
                </tr>
              )}
              {trip.expenses.map((e) => {
                const per = splitEvenly(e.amountMinor, e.shareIds.length)[0] ?? 0;
                const settlement = e.what.startsWith("Settled up");
                return (
                  <tr key={e.id}>
                    <td>
                      {e.what}
                      <div className="sub">
                        {settlement ? "recorded, not sent" : `split ${e.shareIds.length} ways`} · {e.when}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Who m={byId(trip.members, e.payerId)} />
                        {e.payerId === me ? "You" : byId(trip.members, e.payerId)?.name}
                      </span>
                    </td>
                    <td className="amt r">{fmt(e.amountMinor, trip.currency)}</td>
                    <td className="amt r muted">{settlement ? "—" : fmt(per, trip.currency)}</td>
                    <td className="r">
                      <button className="x" aria-label={`Delete ${e.what}`} onClick={() => dispatch({ type: "removeExpense", tripId: trip.id, expenseId: e.id })}>
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          <h3 style={{ fontSize: 19, marginTop: 26 }}>Add a cost</h3>
          <div className="write">
            <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="what was it for…" aria-label="What it was for" />
            <input className="short" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="£ total" aria-label="Amount" onKeyDown={(e) => e.key === "Enter" && add()} />
            <select value={payer} onChange={(e) => setPayer(e.target.value)} aria-label="Who paid">
              {trip.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id === me ? "You paid" : `${m.name} paid`}
                </option>
              ))}
            </select>
            {err && <span className="err">{err}</span>}
          </div>
          <p className="typed" style={{ marginTop: 14 }}>Split between</p>
          <div className="who-split">
            {trip.members.map((m) => {
              const on = shares.includes(m.id);
              return (
                <button
                  key={m.id}
                  aria-pressed={on}
                  onClick={() => setShares(on ? shares.filter((id) => id !== m.id) : [...shares, m.id])}
                >
                  <Who m={m} />
                  {m.id === me ? "You" : m.name}
                </button>
              );
            })}
          </div>
          <button className="pen" style={{ marginTop: 14 }} onClick={add}>
            Write it down
          </button>
        </div>

        <aside>
          <div className="note-card">
            <h3>You</h3>
            <p className="aside-note" style={{ marginBottom: 8 }}>
              {mine < 0 ? "You've had more than you've put in." : mine > 0 ? "You're out of pocket." : "Square with everyone."}
            </p>
            <div className="listrow">
              <span>Your balance</span>
              <b className="num" style={{ color: mine < 0 ? "var(--red)" : mine > 0 ? "var(--green)" : undefined }}>
                {mine === 0 ? "£0" : mine > 0 ? `+${fmt(mine, trip.currency)}` : `−${fmt(-mine, trip.currency)}`}
              </b>
            </div>
            <div className="listrow">
              <span>Your share so far</span>
              <b className="num">{fmt(splitEvenly(spent, trip.members.length)[0] ?? 0, trip.currency)}</b>
            </div>
          </div>

          <div className="note-card">
            <h3>Everyone</h3>
            {bal.map((b) => (
              <div className="listrow" key={b.memberId}>
                <span>
                  <Who m={byId(trip.members, b.memberId)} /> {b.memberId === me ? "You" : byId(trip.members, b.memberId)?.name}
                </span>
                <b className="num" style={{ color: b.net < 0 ? "var(--red)" : b.net > 0 ? "var(--green)" : "var(--ink-3)" }}>
                  {b.net === 0 ? "square" : b.net > 0 ? `+${fmt(b.net, trip.currency)}` : `−${fmt(-b.net, trip.currency)}`}
                </b>
              </div>
            ))}
          </div>

          <div className="note-card">
            <h3>Settle up</h3>
            <p className="aside-note">
              {transfers.length
                ? `${transfers.length} transfer${transfers.length > 1 ? "s" : ""} makes everyone square — not ${trip.members.length * (trip.members.length - 1)}.`
                : "Nobody owes anybody."}
            </p>
            <div className="settle">
              {transfers.map((t, i) => (
                <div className="row" key={i}>
                  <Who m={byId(trip.members, t.from)} />
                  <span>{t.from === me ? "You" : byId(trip.members, t.from)?.name}</span>
                  <span className="muted">→</span>
                  <Who m={byId(trip.members, t.to)} />
                  <span>{t.to === me ? "you" : byId(trip.members, t.to)?.name}</span>
                  <span className="amt">{fmt(t.amount, trip.currency)}</span>
                </div>
              ))}
              {!transfers.length && <div className="row muted">Nothing outstanding.</div>}
            </div>
            {myTransfers.map((t, i) => (
              <button
                className="pen wide"
                style={{ marginTop: 10 }}
                key={i}
                onClick={() => dispatch({ type: "settle", tripId: trip.id, from: t.from, to: t.to, amountMinor: t.amount })}
              >
                {t.from === me
                  ? `Mark ${fmt(t.amount, trip.currency)} to ${byId(trip.members, t.to)?.name} as paid`
                  : `${byId(trip.members, t.from)?.name} has paid you ${fmt(t.amount, trip.currency)}`}
              </button>
            ))}
            <p className="aside-note" style={{ marginTop: 10 }}>
              Marking it paid records the line. The transfer itself happens in your bank.
            </p>
          </div>
        </aside>
      </div>

      <div className="accounts">
        <div>
          <span className="typed">Spent so far</span>
          <div className="v">{fmt(spent, trip.currency)}</div>
          <p className="aside-note">{trip.members.length} of us, {trip.expenses.length} lines</p>
        </div>
        <div>
          <span className="typed">You</span>
          <div className={`v ${mine < 0 ? "owed" : "due"}`}>
            {mine === 0 ? "£0" : mine > 0 ? `+${fmt(mine, trip.currency)}` : `−${fmt(-mine, trip.currency)}`}
          </div>
          <p className="aside-note">{mine < 0 ? "to pay back" : mine > 0 ? "you're owed" : "square"}</p>
        </div>
        <div>
          <span className="typed">Transfers to square up</span>
          <div className="v">{transfers.length}</div>
          <p className="aside-note">simplified, so nobody pays twice</p>
        </div>
      </div>
    </div>
  );
}
