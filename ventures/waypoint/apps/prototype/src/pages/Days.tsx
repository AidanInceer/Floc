import { useState } from "react";
import { balances, useStore } from "../store";
import { fmt } from "../money";
import { Who, byId } from "../ui";
import type { Trip } from "../types";

export function Days({ trip }: { trip: Trip }) {
  const { state, dispatch } = useStore();
  const me = state.meId;
  const [dayIdx, setDayIdx] = useState(3);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [pin, setPin] = useState("");

  if (!trip.days.length) {
    return (
      <div className="sheet">
        <div className="ruled">
          <span className="typed">{trip.title}</span>
          <h2 style={{ fontSize: 25, margin: "4px 0 2px" }}>No days yet</h2>
          <div className="empty">
            <span className="hand">Dates first, then days.</span>
            <p className="aside-note">Once a week is locked and the stops are down, a page appears for each day.</p>
          </div>
        </div>
      </div>
    );
  }

  const day = trip.days[Math.min(dayIdx, trip.days.length - 1)];
  const myBalance = balances(trip).find((b) => b.memberId === me)?.net ?? 0;
  const undecided = day.events.filter((e) => e.optional).length;

  function saveNote(eventId: string) {
    if (!text.trim()) return;
    dispatch({ type: "addNote", tripId: trip.id, eventId, text: text.trim() });
    setText("");
    setNoteFor(null);
  }

  return (
    <div className="sheet">
      <span className="tape l" />
      {/* Day tabs are state, not routes — clicking one never moves the page. */}
      <div className="dayrow">
        {trip.days.map((d, i) => (
          <button
            key={d.id}
            aria-current={i === dayIdx ? "true" : undefined}
            onClick={() => setDayIdx(i)}
          >
            <b>{d.short}</b>
            <span>{d.label}</span>
          </button>
        ))}
      </div>

      <div className="two">
        <div className="ruled">
          <span className="typed">Day {dayIdx + 1} of {trip.days.length}</span>
          <h2 style={{ fontSize: 27, margin: "4px 0 2px" }}>{day.date}</h2>
          <p className="aside-note">{day.meta}</p>

          <div className="entry">
            {day.events.map((e) => (
              <div className={`ev${e.optional ? " maybe" : ""}`} key={e.id}>
                <div className="h">{e.time}{e.optional ? " · only if we fancy it" : ""}</div>
                <div className="ti">{e.title}</div>
                {e.body && <div className="b">{e.body}</div>}
                {(e.tags?.length || true) && (
                  <div className="c">
                    {e.tags?.map((t) => (
                      <span className={`mark${/booked|£|included/i.test(t) && !/not booked/i.test(t) ? " done" : /not booked|needs/i.test(t) ? " todo" : " open"}`} key={t}>
                        {t}
                      </span>
                    ))}
                    <button
                      className="pen plain"
                      onClick={() => {
                        setNoteFor(noteFor === e.id ? null : e.id);
                        setText("");
                      }}
                    >
                      {noteFor === e.id ? "Never mind" : "Add a note"}
                    </button>
                  </div>
                )}

                {e.notes.map((n) => (
                  <div className={`margin-note${n.tone === "urgent" ? " red" : ""}`} key={n.id}>
                    <div className="by">
                      <Who m={byId(trip.members, n.byId)} /> {byId(trip.members, n.byId)?.name ?? "Someone"}, {n.when}
                    </div>
                    {n.text}
                  </div>
                ))}

                {noteFor === e.id && (
                  <div className="write">
                    <textarea
                      autoFocus
                      value={text}
                      onChange={(ev) => setText(ev.target.value)}
                      placeholder="everyone on the trip sees this…"
                      aria-label={`A note on ${e.title}`}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) saveNote(e.id);
                        if (ev.key === "Escape") setNoteFor(null);
                      }}
                    />
                    <button className="pen" disabled={!text.trim()} onClick={() => saveNote(e.id)}>
                      Pin it
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <aside>
          <div className="note-card">
            <h3>Today, roughly</h3>
            <div className="listrow">
              <span>Headline</span>
              <b style={{ textAlign: "right" }}>{day.headline}</b>
            </div>
            <div className="listrow">
              <span>Things on the page</span>
              <b className="num">{day.events.length}</b>
            </div>
            <div className="listrow">
              <span>Still undecided</span>
              <b style={{ color: undecided ? "var(--red)" : undefined }}>{undecided ? `${undecided} things` : "nothing"}</b>
            </div>
            <div className="listrow">
              <span>You're</span>
              <b className="num" style={{ color: myBalance < 0 ? "var(--red)" : "var(--green)" }}>
                {myBalance < 0 ? `${fmt(-myBalance, trip.currency)} down` : `${fmt(myBalance, trip.currency)} up`}
              </b>
            </div>
          </div>

          <div className="note-card">
            <h3>Jobs</h3>
            <p className="aside-note" style={{ marginBottom: 6 }}>
              Agreed once, shown on every day.
            </p>
            {trip.members.slice(0, 4).map((m, i) => (
              <div className="listrow" key={m.id}>
                <span>
                  <Who m={m} /> {m.id === me ? "You" : m.name}
                </span>
                <span>{["driving", "lunch table", "cottage keys", "food shop"][i]}</span>
              </div>
            ))}
          </div>

          <div className="note-card">
            <h3>Pinned to the trip</h3>
            {trip.notes.length === 0 && <p className="aside-note">Nothing pinned yet.</p>}
            {trip.notes.map((n) => (
              <div className={`margin-note${n.tone === "urgent" ? " red" : ""}`} style={{ marginTop: 6 }} key={n.id}>
                <div className="by">
                  <Who m={byId(trip.members, n.byId)} /> {byId(trip.members, n.byId)?.name ?? "Someone"}
                </div>
                {n.text}
              </div>
            ))}
            <div className="write">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="write something for everyone…"
                aria-label="A note on the whole trip"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && pin.trim()) {
                    dispatch({ type: "addNote", tripId: trip.id, text: pin.trim() });
                    setPin("");
                  }
                }}
              />
            </div>
          </div>

          <div className="note-card">
            <h3>No signal out there</h3>
            <p className="aside-note" style={{ marginBottom: 10 }}>
              Half this road has none. The days you've opened are already saved to this browser.
            </p>
            <button className="pen plain wide" onClick={() => dispatch({ type: "nudge", key: `${trip.id}:offline` })}>
              {state.nudged.includes(`${trip.id}:offline`) ? `Saved days 1–${trip.days.length}` : `Save days 1–${trip.days.length}`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
