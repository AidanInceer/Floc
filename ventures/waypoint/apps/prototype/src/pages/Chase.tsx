import { chores, useStore } from "../store";
import { Who, go } from "../ui";
import type { Trip } from "../types";

// Stage 10 is not a wizard step but an always-on view (ADR 0005): one list of
// what's waiting on you, and one way to nudge everyone else.

export function Chase({ trip }: { trip: Trip }) {
  const { state, dispatch } = useStore();
  const all = chores(state);
  const here = all.filter((c) => c.tripId === trip.id);
  const elsewhere = all.filter((c) => c.tripId !== trip.id);

  return (
    <div className="sheet">
      <span className="tape l" />
      <div className="two">
        <div className="ruled">
          <span className="typed">{trip.title} · the loose ends</span>
          <h2 style={{ fontSize: 25, margin: "4px 0 2px" }}>
            {here.length ? `${here.length} thing${here.length > 1 ? "s" : ""} waiting on you` : "Nothing waiting on you"}
          </h2>
          <p className="aside-note">Sorted by what stops other people getting on with theirs.</p>

          {here.length === 0 && (
            <div className="empty">
              <span className="hand">All clear.</span>
              <p className="aside-note">You'll get one digest when something new needs you — never a notification per event.</p>
            </div>
          )}

          {[...here].sort((a, b) => Number(b.urgent) - Number(a.urgent)).map((c) => (
            <div className={`chore${c.urgent ? " urgent" : ""}`} key={c.key}>
              <span className="box">{c.urgent ? "✗" : "☐"}</span>
              <div style={{ minWidth: 0 }}>
                <div className="n">{c.what}</div>
                <div className="d">{c.detail}</div>
              </div>
              <span className="go">
                <button className="pen plain" onClick={() => go(c.goto)}>
                  Go
                </button>
              </span>
            </div>
          ))}

          {elsewhere.length > 0 && (
            <>
              <h3 style={{ fontSize: 19, marginTop: 30 }}>And on your other trips</h3>
              <p className="aside-note">One list across every book — that's the whole point of it.</p>
              {elsewhere.map((c) => (
                <div className={`chore${c.urgent ? " urgent" : ""}`} key={c.key}>
                  <span className="box">{c.urgent ? "✗" : "☐"}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="n">{c.what}</div>
                    <div className="d">
                      {c.tripTitle} · {c.detail}
                    </div>
                  </div>
                  <span className="go">
                    <button className="pen plain" onClick={() => go(c.goto)}>
                      Go
                    </button>
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        <aside>
          <div className="note-card">
            <h3>Waiting on them</h3>
            <p className="aside-note" style={{ marginBottom: 8 }}>
              A nudge is one message from the book, not from you. Nobody gets more than one a day.
            </p>
            {trip.members
              .filter((m) => m.id !== state.meId)
              .map((m) => {
                const key = `${trip.id}:nudge:${m.id}`;
                const done = state.nudged.includes(key);
                const owes = trip.weeks.length && !Object.keys(trip.availability[m.id] ?? {}).length;
                return (
                  <div className="listrow" key={m.id}>
                    <span>
                      <Who m={m} /> {m.name}
                      {owes ? " — no dates" : ""}
                    </span>
                    <button
                      className="pen plain"
                      style={{ padding: "3px 9px", fontSize: 10.5 }}
                      disabled={done}
                      onClick={() => dispatch({ type: "nudge", key })}
                    >
                      {done ? "Nudged" : "Nudge"}
                    </button>
                  </div>
                );
              })}
          </div>

          <div className="note-card">
            <h3>Quiet hours</h3>
            <p className="aside-note">
              Nothing goes out between ten at night and seven in the morning, whatever it is.
            </p>
          </div>

          <div className="note-card">
            <h3>Start again</h3>
            <p className="aside-note" style={{ marginBottom: 10 }}>
              This prototype keeps everything in your browser. Reset puts the three books back as they were.
            </p>
            <button className="pen plain wide" onClick={() => dispatch({ type: "reset" })}>
              Reset the prototype
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
