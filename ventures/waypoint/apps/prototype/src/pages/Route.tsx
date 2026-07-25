import { useState } from "react";
import { useStore } from "../store";
import type { Stop, Trip } from "../types";

// The signature object (ADR 0012): a trip is a line with stops on it, and the
// line doubles as wayfinder and status board. Filled bead = booked, empty
// ring = nothing booked, and the leg style says how you get there.

const MAP_W = 620;
const MAP_H = 470;
const px = (s: Stop) => ({ x: 46 + (s.x / 100) * 528, y: 34 + (s.y / 100) * 402 });

const LEG_STYLE: Record<string, { stroke: string; dash?: string }> = {
  van: { stroke: "var(--pen)" },
  train: { stroke: "var(--pen)", dash: "9 4" },
  ferry: { stroke: "var(--highlight-ink)", dash: "7 6" },
  foot: { stroke: "var(--red)", dash: "1 5" },
  plane: { stroke: "var(--ink-3)", dash: "3 6" },
};

export function Route({ trip }: { trip: Trip }) {
  const { dispatch } = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [name, setName] = useState("");

  const nights = trip.stops.reduce((n, s) => n + s.nights, 0);
  const unbooked = trip.stops.filter((s) => !s.booked && s.nights > 0);

  if (!trip.stops.length) {
    return (
      <div className="sheet">
        <div className="ruled">
          <span className="typed">{trip.title} · the fold-out</span>
          <h2 style={{ fontSize: 25, margin: "4px 0 2px" }}>No route yet</h2>
          <div className="empty">
            <span className="hand">Where does it start?</span>
            <p className="aside-note">Add the first stop and the line draws itself. Nights and drives hang off it.</p>
            <div className="write" style={{ justifyContent: "center" }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="first stop…"
                aria-label="First stop"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) {
                    dispatch({ type: "addStop", tripId: trip.id, name: name.trim() });
                    setName("");
                  }
                }}
              />
              <button
                className="pen"
                disabled={!name.trim()}
                onClick={() => {
                  dispatch({ type: "addStop", tripId: trip.id, name: name.trim() });
                  setName("");
                }}
              >
                Add it
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet">
      <div className="ruled" style={{ paddingBottom: 16 }}>
        <span className="typed">{trip.title} · the fold-out</span>
        <h2 style={{ fontSize: 25, margin: "4px 0 2px" }}>
          {nights} nights, {trip.stops.length} stops
        </h2>
        <p className="aside-note">
          {unbooked.length
            ? `Circles we've booked are filled in. ${unbooked.map((s) => s.name).join(" and ")} ${unbooked.length === 1 ? "is" : "are"} still an empty ring.`
            : "Every circle is filled in — there's a bed everywhere."}
        </p>
      </div>

      <div className="mapgrid" style={{ borderTop: "1px dashed var(--rule-2)" }}>
        <div className="canvas">
          <svg className="map" viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label={`Sketch map of ${trip.title} with ${trip.stops.length} stops`}>
            {trip.stops.length > 2 && (
              <path
                d="M120 40 C 60 90, 40 170, 70 240 C 95 300, 80 360, 130 410 C 200 460, 320 455, 400 420 C 470 390, 520 330, 520 260 C 520 180, 470 100, 390 60 C 310 22, 180 0, 120 40 Z"
                fill="var(--sheet-2)"
                stroke="var(--rule-2)"
                strokeWidth="1.5"
              />
            )}
            {trip.stops.slice(1).map((s, i) => {
              const a = px(trip.stops[i]);
              const b = px(s);
              const st = LEG_STYLE[s.legIn?.mode ?? "van"];
              return (
                <path
                  key={s.id}
                  d={`M${a.x} ${a.y} L${b.x} ${b.y}`}
                  fill="none"
                  stroke={st.stroke}
                  strokeWidth="2"
                  strokeDasharray={st.dash}
                  strokeLinecap="round"
                />
              );
            })}
            {trip.stops.map((s, i) => {
              const p = px(s);
              const right = s.x < 70;
              return (
                <g key={s.id} onClick={() => setSel(s.id)} style={{ cursor: "pointer" }}>
                  {/* The pin on the map is the pin in the list: same number,
                      same teardrop, filled only when there's a bed booked. */}
                  {s.nights === 0 ? (
                    <circle cx={p.x} cy={p.y} r="6" fill="var(--sheet)" stroke="var(--highlight-ink)" strokeWidth="2" />
                  ) : (
                    <g transform={`translate(${p.x} ${p.y})`}>
                      <path
                        d="M0 0 c-7 -9 -11 -13 -11 -19 a11 11 0 1 1 22 0 c0 6 -4 10 -11 19 z"
                        fill={s.booked ? "var(--pen)" : "var(--sheet)"}
                        stroke={s.booked ? "var(--pen)" : "var(--red)"}
                        strokeWidth="2"
                      />
                      <text
                        x="0"
                        y="-15"
                        textAnchor="middle"
                        fontSize="11"
                        fontFamily="IBM Plex Mono, monospace"
                        fill={s.booked ? "#fff" : "var(--red)"}
                      >
                        {i + 1}
                      </text>
                    </g>
                  )}
                  <text
                    x={right ? p.x + 16 : p.x - 16}
                    y={p.y - 2}
                    textAnchor={right ? "start" : "end"}
                    fontSize="14"
                    fontWeight="600"
                    fill="var(--ink)"
                  >
                    {s.name}
                  </text>
                  <text
                    x={right ? p.x + 16 : p.x - 16}
                    y={p.y + 13}
                    textAnchor={right ? "start" : "end"}
                    fontSize="12"
                    fill={s.booked ? "var(--ink-3)" : "var(--red)"}
                    fontFamily={s.booked ? undefined : "Caveat, cursive"}
                  >
                    {s.booked
                      ? s.nights === 0
                        ? "day trip"
                        : `${s.nights} night${s.nights > 1 ? "s" : ""}`
                      : "nowhere booked!"}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="over">
            <span className="mark">{nights} nights</span>
            <span className="mark">{trip.stops.filter((s) => s.legIn?.mode === "van").length} drives</span>
            {unbooked.length ? <span className="mark open">{unbooked.length} bed{unbooked.length > 1 ? "s" : ""} missing</span> : <span className="mark done">All booked</span>}
          </div>

          <div className="keybox">
            <span>
              <i className="leg" />
              the van
            </span>
            <span>
              <i className="leg ferry" />
              ferry — nobody drives
            </span>
            <span>
              <i className="leg foot" />
              on foot
            </span>
            <span>◯ &nbsp;empty ring = nothing booked</span>
          </div>
        </div>

        <aside style={{ padding: 0 }}>
          {trip.stops.map((s, i) => (
            <div key={s.id}>
              {s.legIn && (
                <div className="st leg-row">
                  <span className="i">↓</span>
                  <div>
                    <div className="d">
                      {s.legIn.time} · {s.legIn.detail}
                    </div>
                  </div>
                </div>
              )}
              <div className={`st${s.booked ? " booked" : ""}${sel === s.id ? " on" : ""}`}>
                <span className="i">
                  <span>{s.nights === 0 ? "·" : i + 1}</span>
                </span>
                <div>
                  <div className="n">{s.name}</div>
                  <div className="d">{s.detail}</div>
                  <div className="tg">
                    <button
                      className={`mark ${s.booked ? "done" : "todo"}`}
                      aria-pressed={s.booked}
                      onClick={() => dispatch({ type: "toggleBooked", tripId: trip.id, stopId: s.id })}
                    >
                      {s.booked ? "Bed booked" : "Needs a bed"}
                    </button>
                    <span className="nights">
                      <button
                        aria-label={`One fewer night in ${s.name}`}
                        onClick={() => dispatch({ type: "setNights", tripId: trip.id, stopId: s.id, nights: s.nights - 1 })}
                      >
                        −
                      </button>
                      <span className="num" style={{ fontSize: 13 }}>
                        {s.nights === 0 ? "day trip" : `${s.nights}n`}
                      </span>
                      <button
                        aria-label={`One more night in ${s.name}`}
                        onClick={() => dispatch({ type: "setNights", tripId: trip.id, stopId: s.id, nights: s.nights + 1 })}
                      >
                        +
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="st add">
            <span className="i">+</span>
            <div style={{ minWidth: 0 }}>
              <div className="n">Add a stop</div>
              <div className="d">Everything after it shuffles along.</div>
              <div className="write" style={{ marginTop: 6 }}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="where next…"
                  aria-label="Another stop"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) {
                      dispatch({ type: "addStop", tripId: trip.id, name: name.trim() });
                      setName("");
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
