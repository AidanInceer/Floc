import { useState } from "react";
import { useStore } from "./store";
import { Home } from "./components/Home";
import { Dashboard } from "./components/Dashboard";
import { Accounts } from "./components/Accounts";
import { Plan } from "./components/Plan";
import { Cashflow } from "./components/Cashflow";
import { Advice } from "./components/Advice";
import { Onboarding } from "./components/Onboarding";

// The rail's keys are two-character ledger references rather than icons — the
// same device a paper register uses to point at a section.
const NAV = [
  { key: "overview", code: "ov", label: "Overview", group: "Position" },
  { key: "accounts", code: "ac", label: "Accounts", group: "Position" },
  { key: "cashflow", code: "cf", label: "Forecast", group: "Horizon" },
  { key: "plan", code: "pl", label: "Plan & inputs", group: "Horizon" },
  { key: "guidance", code: "gd", label: "Findings", group: "Guidance" },
];

export function App() {
  const { status, error, state, reset } = useStore();
  const [tab, setTab] = useState("home");

  if (status === "loading") {
    return (
      <div className="boot">
        <div>
          <span className="eyebrow">Opening your ledger</span>
          <p>Starting the local SQLite database and applying any pending migrations.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="boot">
        <div>
          <span className="eyebrow">The database did not open</span>
          <p>{error}</p>
          <div style={{ marginTop: 18 }}>
            <button className="btn btn-primary" onClick={() => void reset()}>
              Rebuild the database
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!state.onboarded) return <Onboarding />;

  if (tab === "home") {
    return (
      <>
        {error && <WriteError message={error} />}
        <Home go={setTab} />
      </>
    );
  }

  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <>
      {error && <WriteError message={error} />}
      <div className="shell">
        <nav className="rail" aria-label="Sections">
          <button
            className="mark"
            onClick={() => setTab("home")}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <span className="mark-glyph">₤</span>
            <span className="mark-name">
              Ledger <em>/ home</em>
            </span>
          </button>

          {groups.map((g) => (
            <div key={g}>
              <div className="rail-group eyebrow">{g}</div>
              {NAV.filter((n) => n.group === g).map((n) => (
                <button
                  key={n.key}
                  className={`rail-link ${tab === n.key ? "is-active" : ""}`}
                  aria-current={tab === n.key ? "page" : undefined}
                  onClick={() => setTab(n.key)}
                >
                  <span className="rail-key">{n.code}</span>
                  {n.label}
                </button>
              ))}
            </div>
          ))}

          <div className="rail-spacer" />

          <div className="rail-foot">
            <button
              className="rail-link"
              onClick={() => {
                if (confirm("Rebuild the database and restore the seeded example?")) {
                  void reset();
                }
              }}
            >
              <span className="rail-key">rs</span> Reset data
            </button>
            <div className="note">
              SQLite in your browser. Reset drops the file and re-runs the migrations.
            </div>
          </div>
        </nav>

        <main className="main">
          {tab === "overview" && <Dashboard go={setTab} />}
          {tab === "cashflow" && <Cashflow />}
          {tab === "guidance" && <Advice />}
          {tab === "accounts" && <Accounts />}
          {tab === "plan" && <Plan />}
        </main>
      </div>
    </>
  );
}

function WriteError({ message }: { message: string }) {
  return (
    <div className="banner" role="alert">
      <strong>Not saved.</strong> {message}
    </div>
  );
}
