import { useState } from "react";
import { tally, useStore } from "../store";
import { fmt, parseAmount } from "../money";
import { Who, byId } from "../ui";
import type { Free, Trip, Vote } from "../types";

const FREE_CYCLE: Record<Free, Free> = { y: "m", m: "n", n: "y" };
const FREE_GLYPH: Record<Free, string> = { y: "✓", m: "?", n: "✗" };
const FREE_WORD: Record<Free, string> = { y: "can go", m: "might", n: "can't" };

export function Decide({ trip }: { trip: Trip }) {
  const { state, dispatch } = useStore();
  const me = state.meId;
  const [blockFor, setBlockFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [costErr, setCostErr] = useState("");

  const live = trip.ideas.filter((i) => !i.rejected);
  const best = Math.max(1, ...live.map((i) => tally(i).up));

  function castVote(ideaId: string, vote: Vote) {
    if (vote === "block") {
      setBlockFor(ideaId);
      setReason("");
      return;
    }
    setBlockFor(null);
    dispatch({ type: "vote", tripId: trip.id, ideaId, vote });
  }

  function addIdea() {
    if (!name.trim()) return;
    let estMinor: number | undefined;
    if (cost.trim()) {
      const parsed = parseAmount(cost);
      if (parsed === null) {
        setCostErr("Write it as a number — 620 or 620.50.");
        return;
      }
      estMinor = parsed;
    }
    setCostErr("");
    dispatch({ type: "addIdea", tripId: trip.id, name: name.trim(), estMinor });
    setName("");
    setCost("");
  }

  const weekScore = (weekId: string) =>
    trip.members.filter((m) => (trip.availability[m.id] ?? {})[weekId] === "y").length;
  const bestWeek = trip.weeks.length
    ? trip.weeks.reduce((a, b) => (weekScore(b.id) > weekScore(a.id) ? b : a))
    : undefined;

  return (
    <div className="sheet">
      <span className="tape r" />
      <div className="two">
        <div className="ruled">
          <span className="typed">
            {trip.title} · {trip.members.length} of us · page 2
          </span>
          <h2 style={{ fontSize: 25, margin: "4px 0 2px" }}>Where are we going?</h2>
          <p className="aside-note">Tallied as people write. A cross needs a reason next to it — that's the rule.</p>

          {trip.ideas.length === 0 && (
            <div className="empty">
              <span className="hand">Nothing on the board yet.</span>
              <p className="aside-note">Write the first place below. Anyone with the link can add to it.</p>
            </div>
          )}

          {trip.ideas.map((idea) => {
            const t = tally(idea);
            const mine = idea.votes[me];
            const author = byId(trip.members, idea.byId);
            const blocks = Object.entries(idea.blockReasons);
            return (
              <div key={idea.id}>
                <div className={`idea${idea.rejected || t.blocks > 1 ? " out" : ""}`}>
                  <div>
                    <div className="n">{idea.name}</div>
                    <div className="m">
                      {author?.name ?? "Someone"}
                      {idea.estMinor ? ` · about ${fmt(idea.estMinor, trip.currency)} each` : ""}
                      {idea.detail ? ` · ${idea.detail}` : ""}
                    </div>
                    {blocks.map(([who, why]) => (
                      <div className="m" key={who}>
                        <em>
                          {byId(trip.members, who)?.name ?? "Someone"}: {why}
                        </em>
                      </div>
                    ))}
                  </div>
                  <div className="tally">
                    <span className={`t${t.blocks ? " cold" : ""}`}>
                      <i style={{ width: `${Math.round((t.up / best) * 100)}%` }} />
                    </span>
                    <span className="x">
                      +{t.up}
                      {t.blocks ? ` −${t.blocks}` : ""}
                    </span>
                  </div>
                  <div className="vote" role="group" aria-label={`Your vote on ${idea.name}`}>
                    <button aria-pressed={mine === "up"} title="Yes" onClick={() => castVote(idea.id, "up")}>
                      ✓
                    </button>
                    <button aria-pressed={mine === "meh"} title="Don't mind" onClick={() => castVote(idea.id, "meh")}>
                      –
                    </button>
                    <button className="no" aria-pressed={mine === "block"} title="Block" onClick={() => castVote(idea.id, "block")}>
                      ✗
                    </button>
                  </div>
                </div>
                {blockFor === idea.id && (
                  <div className="write" style={{ marginTop: 2, marginBottom: 12 }}>
                    <input
                      autoFocus
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="why not? everyone sees this…"
                      aria-label="Why you're blocking"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && reason.trim()) {
                          dispatch({ type: "vote", tripId: trip.id, ideaId: idea.id, vote: "block", reason });
                          setBlockFor(null);
                        }
                        if (e.key === "Escape") setBlockFor(null);
                      }}
                    />
                    <button
                      className="pen"
                      disabled={!reason.trim()}
                      onClick={() => {
                        dispatch({ type: "vote", tripId: trip.id, ideaId: idea.id, vote: "block", reason });
                        setBlockFor(null);
                      }}
                    >
                      Block it
                    </button>
                    <button className="pen plain" onClick={() => setBlockFor(null)}>
                      Never mind
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="write">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="write a place here…"
              aria-label="A place"
              onKeyDown={(e) => e.key === "Enter" && addIdea()}
            />
            <input
              className="short"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="£ each"
              aria-label="Rough cost each"
              onKeyDown={(e) => e.key === "Enter" && addIdea()}
            />
            <button className="pen" onClick={addIdea} disabled={!name.trim()}>
              Add it
            </button>
            {costErr && <span className="err">{costErr}</span>}
          </div>

          {trip.weeks.length > 0 && (
            <>
              <h2 style={{ fontSize: 25, margin: "34px 0 2px" }}>When can everyone go?</h2>
              <p className="aside-note">
                Your row is the one you can write on — click a box to change it. {trip.members.length - Object.keys(trip.availability).length} of{" "}
                {trip.members.length} haven't filled it in.
              </p>
              <div className="pollwrap">
                <table className="poll">
                  <thead>
                    <tr>
                      <th>Who</th>
                      {trip.weeks.map((w) => (
                        <th key={w.id} className={trip.lockedWeekId === w.id ? "won" : undefined}>
                          {w.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trip.members.map((m) => {
                      const row = trip.availability[m.id] ?? {};
                      const isMe = m.id === me;
                      return (
                        <tr key={m.id} className={isMe ? "me" : undefined}>
                          <td>
                            <span>
                              <Who m={m} /> {isMe ? "You" : m.name}
                            </span>
                          </td>
                          {trip.weeks.map((w) => {
                            const v = row[w.id];
                            return (
                              <td key={w.id}>
                                {isMe ? (
                                  <button
                                    className={`cell mine${v ? ` ${v}` : ""}`}
                                    aria-label={`${w.label}: ${v ? FREE_WORD[v] : "not said"}`}
                                    onClick={() =>
                                      dispatch({ type: "setFree", tripId: trip.id, weekId: w.id, free: v ? FREE_CYCLE[v] : "y" })
                                    }
                                  >
                                    {v ? FREE_GLYPH[v] : ""}
                                  </button>
                                ) : (
                                  <span className={`cell${v ? ` ${v}` : ""}`} title={v ? FREE_WORD[v] : "hasn't said"}>
                                    {v ? FREE_GLYPH[v] : ""}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="typed">All free</td>
                      {trip.weeks.map((w) => {
                        const n = weekScore(w.id);
                        const won = trip.lockedWeekId === w.id;
                        return (
                          <td key={w.id} className={won || (!trip.lockedWeekId && w.id === bestWeek?.id) ? "w" : undefined}>
                            {won ? (
                              "locked"
                            ) : (
                              <button onClick={() => dispatch({ type: "lockWeek", tripId: trip.id, weekId: w.id })}>
                                {n} of {trip.members.length}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="aside-note" style={{ marginTop: 10 }}>
                {trip.lockedWeekId
                  ? `Locked: ${trip.weeks.find((w) => w.id === trip.lockedWeekId)?.label}. Everything else follows from this.`
                  : `Click a total to settle on that week. ${bestWeek?.label} suits the most people.`}
              </p>
            </>
          )}
        </div>

        <aside>
          <div className="note-card">
            <h3>Who's answered</h3>
            <p className="aside-note" style={{ marginBottom: 8 }}>
              Voting doesn't need an account — a link is enough.
            </p>
            {trip.members.map((m) => {
              const voted = trip.ideas.some((i) => i.votes[m.id]);
              const dated = Object.keys(trip.availability[m.id] ?? {}).length > 0;
              const label = voted && dated ? "In" : voted || dated ? "Half" : "Silent";
              const colour = label === "In" ? "var(--green)" : label === "Half" ? "var(--highlight-ink)" : "var(--ink-3)";
              return (
                <div className="listrow" key={m.id}>
                  <span>
                    <Who m={m} /> {m.id === me ? "You" : m.name}
                  </span>
                  <b style={{ color: colour }}>{label}</b>
                </div>
              );
            })}
            <button
              className="pen plain wide"
              style={{ marginTop: 11 }}
              onClick={() => dispatch({ type: "nudge", key: `${trip.id}:silent` })}
            >
              {state.nudged.includes(`${trip.id}:silent`) ? "Nudged — they'll get one digest" : "Nudge whoever's silent"}
            </button>
          </div>

          <div className="note-card">
            <h3>What people can spend</h3>
            <p className="aside-note" style={{ marginBottom: 8 }}>
              Written on folded slips. Only the band shows, never who said what.
            </p>
            <div className="listrow">
              <span>Comfortable up to</span>
              <b className="num">£550–700</b>
            </div>
            <div className="listrow">
              <span>Two people said</span>
              <b style={{ color: "var(--red)" }}>tight</b>
            </div>
            {live.length > 0 && (
              <div className="listrow">
                <span>Front runner</span>
                <b className="num">
                  {live.reduce((a, b) => (tally(b).up > tally(a).up ? b : a)).estMinor
                    ? fmt(live.reduce((a, b) => (tally(b).up > tally(a).up ? b : a)).estMinor!, trip.currency)
                    : "—"}
                </b>
              </div>
            )}
          </div>

          {trip.ground.length > 0 && (
            <div className="note-card">
              <h3>Agreed on page 1</h3>
              {trip.ground.map((g) => (
                <div className="listrow" key={g}>
                  <span>{g}</span>
                  <span>✓</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
