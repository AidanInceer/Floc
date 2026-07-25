import { useStore } from "../store";
import { Register } from "./ui";
import { glyph } from "./Dashboard";

export function Advice() {
  const { rubrics, state } = useStore();
  const { profile } = state;

  const emergency = rubrics.find((r) => r.id === "emergency");
  const buffer = rubrics.find((r) => r.id === "buffer");

  // A real order of operations — each rung only makes sense once the one below
  // it is in place — so this is the one place numbering earns its keep.
  const ladder = [
    { label: "Cash buffer for the year ahead", done: buffer?.status === "good" },
    { label: "Costly debt cleared", done: true },
    { label: "Emergency fund at target", done: emergency?.status === "good" },
    { label: "Investing toward longer goals", done: false },
  ];
  const inPlace = ladder.filter((s) => s.done).length;

  return (
    <>
      <header className="masthead">
        <div className="masthead-text">
          <span className="eyebrow">Guidance · {profile.risk} profile</span>
          <h1 className="display display-l">Findings</h1>
          <p>
            Each finding is produced by a rule applied to your own figures, and names
            the rule it used. Nothing here is tailored investment advice.
          </p>
        </div>
      </header>

      <Register
        label="Resilience"
        note="Work upward. Each step assumes the one below it is already in place."
        title="Steps in order"
        aside={
          <span className="tag">
            {inPlace} of {ladder.length} in place
          </span>
        }
      >
        <div className="ladder">
          {ladder.map((s, i) => (
            <div className={`ladder-step ${s.done ? "is-done" : ""}`} key={s.label}>
              <span className="ladder-index">{String(i + 1).padStart(2, "0")}</span>
              <span className="ladder-label">{s.label}</span>
              <span className="ladder-state">{s.done ? "in place" : "not yet"}</span>
            </div>
          ))}
        </div>
      </Register>

      <Register
        label="All findings"
        note="Recomputed every time an input changes."
        title={`${rubrics.length} findings`}
      >
        {rubrics.map((r) => (
          <div className={`finding is-${r.status}`} key={r.id}>
            <div className="finding-glyph">{glyph(r.status)}</div>
            <div>
              <h3>{r.title}</h3>
              <p>{r.detail}</p>
              <div className="source">{r.source}</div>
            </div>
          </div>
        ))}
      </Register>

      <p className="disclaimer">
        General, informational guidance grounded in your own data. Not regulated
        financial advice, and not a substitute for a professional adviser. Tax and
        allowance figures are placeholders pending the knowledge-base module.
      </p>
    </>
  );
}
