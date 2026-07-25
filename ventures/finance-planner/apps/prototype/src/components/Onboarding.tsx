import { useState } from "react";
import { useStore } from "../store";
import type { Risk } from "../domain/types";

// The choice is expressed in months of cover, because that is the thing the
// number actually controls — not a risk-appetite adjective.
const CUSHIONS: {
  key: Risk;
  months: number;
  title: string;
  sub: string;
  bufferFloor: number;
}[] = [
  { key: "cautious", months: 6, title: "A wide cushion", sub: "Six months of essentials set aside before investing", bufferFloor: 4000 },
  { key: "balanced", months: 6, title: "A working cushion", sub: "Three to six months, then the surplus is invested", bufferFloor: 2500 },
  { key: "adventurous", months: 3, title: "A lean cushion", sub: "Smaller reserve, investing starts sooner", bufferFloor: 1500 },
];

export function Onboarding() {
  const { state, setProfile, completeOnboarding } = useStore();
  const [name, setName] = useState(state.profile.name);
  const [risk, setRisk] = useState<Risk>(state.profile.risk);

  const finish = () => {
    const choice = CUSHIONS.find((c) => c.key === risk)!;
    setProfile({
      name: name.trim() || "there",
      risk,
      emergencyMonths: choice.months,
      bufferFloor: choice.bufferFloor,
    });
    completeOnboarding();
  };

  return (
    <div className="onboard-wrap">
      <div className="onboard">
        <span className="eyebrow">Setup · two questions</span>
        <h1 className="display display-l">Let's get a forecast on screen</h1>
        <p className="onboard-lede">
          A worked example is already loaded, so you will see real figures straight
          away. Replace them with your own whenever you like.
        </p>

        <div className="field" style={{ marginBottom: 22 }}>
          <label htmlFor="ob-name">What should we call you?</label>
          <input
            id="ob-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="field" style={{ marginBottom: 10 }}>
          <label>How much cash do you want to keep in reserve?</label>
        </div>

        {CUSHIONS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`choice ${risk === c.key ? "is-selected" : ""}`}
            aria-pressed={risk === c.key}
            onClick={() => setRisk(c.key)}
          >
            <span className="choice-months num">{c.months}mo</span>
            <span style={{ flex: 1 }}>
              <span className="choice-title" style={{ display: "block" }}>
                {c.title}
              </span>
              <span className="choice-sub">{c.sub}</span>
            </span>
          </button>
        ))}

        <button className="btn btn-primary" style={{ width: "100%", marginTop: 18, justifyContent: "center" }} onClick={finish}>
          See my forecast
        </button>

        <p className="note" style={{ textAlign: "center", marginTop: 14, fontSize: "0.72rem" }}>
          Prototype. Everything is stored in a SQLite database inside your browser and
          can be reset at any time.
        </p>
      </div>
    </div>
  );
}
