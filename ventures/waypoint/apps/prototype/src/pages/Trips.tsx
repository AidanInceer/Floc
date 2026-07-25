import { useState } from "react";
import { balances, chores, useStore } from "../store";
import { fmt } from "../money";
import { Who, byId, go } from "../ui";
import type { Trip } from "../types";

function Thumb({ trip }: { trip: Trip }) {
  // The signature object, small: a trip is a line with stops on it. Filled
  // bead = booked, hollow = nothing booked yet.
  if (!trip.stops.length) {
    return (
      <div className="thumb">
        <svg viewBox="0 0 200 74" aria-hidden="true">
          <path d="M20 48 C 70 22, 120 64, 178 28" stroke="var(--pen)" strokeWidth="1.4" fill="none" strokeDasharray="5 5" />
          <circle cx="20" cy="48" r="3.5" fill="var(--pen)" />
          <circle cx="178" cy="28" r="5" fill="none" stroke="var(--red)" strokeWidth="1.6" />
          <text x="116" y="20" fontSize="16" fill="var(--red)" fontFamily="Caveat, cursive">
            where?
          </text>
        </svg>
      </div>
    );
  }
  const pts = trip.stops.map((s) => ({ x: 14 + (s.x / 100) * 172, y: 10 + (s.y / 100) * 54, booked: s.booked }));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const done = trip.phase === "settled";
  return (
    <div className="thumb">
      <svg viewBox="0 0 200 74" aria-hidden="true">
        <path d={d} stroke={done ? "var(--green)" : "var(--pen)"} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) =>
          p.booked ? (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={done ? "var(--green)" : "var(--pen)"} />
          ) : (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="none" stroke="var(--red)" strokeWidth="1.5" />
          ),
        )}
      </svg>
    </div>
  );
}

function phaseMark(trip: Trip) {
  if (trip.phase === "settled") return <span className="stamp">Settled</span>;
  if (trip.phase === "deciding") return <span className="mark open">Poll open</span>;
  if (trip.phase === "dated") return <span className="mark done">Dates settled</span>;
  return <span className="mark done">Route drawn</span>;
}

export function Trips() {
  const { state, dispatch } = useStore();
  const [title, setTitle] = useState("");
  const mine = chores(state);

  return (
    <main className="page">
      <div className="sheet">
        <span className="tape l" />
        <div className="ruled" style={{ paddingBottom: 0 }}>
          <span className="typed">Sam's shelf</span>
          <h2 style={{ fontSize: 25, marginTop: 4 }}>
            {state.trips.length} {state.trips.length === 1 ? "book" : "books"} on the go
          </h2>
          <p className="aside-note">Two being argued about, one finished and mostly paid for.</p>
        </div>

        <div className="three" style={{ marginTop: 14, borderTop: "1px dashed var(--rule-2)" }}>
          {state.trips.map((t) => {
            const todo = mine.filter((c) => c.tripId === t.id).slice(0, 2);
            return (
              <button className="trip" key={t.id} onClick={() => go(`#/t/${t.id}/${t.stops.length ? "route" : "decide"}`)}>
                <Thumb trip={t} />
                <h3>{t.title}</h3>
                <div className="when">
                  {t.when} · {t.members.length} of us
                </div>
                <div className="line">
                  {phaseMark(t)}
                  <span className="whos">
                    {t.members.slice(0, 4).map((m) => (
                      <Who key={m.id} m={m} />
                    ))}
                  </span>
                </div>
                {todo.length ? (
                  todo.map((c) => (
                    <div className={`todo${c.urgent ? " urgent" : ""}`} key={c.key}>
                      {c.what}
                    </div>
                  ))
                ) : (
                  <div className="todo">Nothing waiting on you</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="two" style={{ borderTop: "1px dashed var(--rule-2)" }}>
          <div className="ruled">
            <span className="typed">Lately</span>
            <h2 style={{ fontSize: 22, margin: "3px 0 8px" }}>What people wrote</h2>
            {state.trips
              .flatMap((t) => t.activity.map((a) => ({ ...a, trip: t })))
              .slice(0, 8)
              .map((a) => {
                const m = byId(a.trip.members, a.byId);
                return (
                  <div className="diary" key={a.trip.id + a.id}>
                    <Who m={m} />
                    <span>
                      <b>{m?.name ?? "Someone"}</b> {a.text}
                    </span>
                    <span className="t">{a.when}</span>
                  </div>
                );
              })}
          </div>

          <aside>
            <div className="note-card">
              <h3>Your turn</h3>
              <p className="aside-note" style={{ marginBottom: 8 }}>
                {mine.length ? `${mine.length} things across ${new Set(mine.map((c) => c.tripId)).size} trips.` : "Nothing, for once."}
              </p>
              {mine.slice(0, 4).map((c) => (
                <div className="listrow" key={c.key}>
                  <span>{c.what}</span>
                  <b style={c.urgent ? { color: "var(--red)" } : undefined}>{c.tripTitle.split(",")[0]}</b>
                </div>
              ))}
              {mine.length > 0 && (
                <button className="pen wide" style={{ marginTop: 12 }} onClick={() => go(`#/t/${mine[0].tripId}/chase`)}>
                  Work through them
                </button>
              )}
            </div>

            <div className="note-card">
              <h3>What you're owed</h3>
              <p className="aside-note" style={{ marginBottom: 8 }}>
                Across every book. Nothing here moves money.
              </p>
              {state.trips
                .filter((t) => t.expenses.length)
                .map((t) => {
                  const b = balances(t).find((x) => x.memberId === state.meId);
                  const net = b?.net ?? 0;
                  return (
                    <div className="listrow" key={t.id}>
                      <span>{t.title.split(",")[0]}</span>
                      <b className="num" style={{ color: net < 0 ? "var(--red)" : net > 0 ? "var(--green)" : undefined }}>
                        {net === 0 ? "square" : net > 0 ? `+${fmt(net, t.currency)}` : `−${fmt(-net, t.currency)}`}
                      </b>
                    </div>
                  );
                })}
            </div>

            <div className="note-card">
              <h3>New book</h3>
              <p className="aside-note" style={{ marginBottom: 4 }}>
                Blank. You can invite people before you know where you're going.
              </p>
              <div className="write" style={{ marginTop: 6 }}>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="somewhere, sometime…"
                  aria-label="Name the trip"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && title.trim()) {
                      dispatch({ type: "newTrip", title: title.trim() });
                      setTitle("");
                    }
                  }}
                />
              </div>
              <button
                className="pen wide"
                style={{ marginTop: 12 }}
                disabled={!title.trim()}
                onClick={() => {
                  dispatch({ type: "newTrip", title: title.trim() });
                  setTitle("");
                }}
              >
                Start it
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
