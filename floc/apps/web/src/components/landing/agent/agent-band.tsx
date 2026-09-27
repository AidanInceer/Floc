import { AgentScene } from "./agent-scene";

/** The pocket travel agent: not built yet, so the band says it is coming. */
export function AgentBand({ sellingPro }: { sellingPro: boolean }) {
  return (
    <div>
      <div className="text-center">
        <span className="typed inline-flex rounded-full border border-dashed border-rule-strong bg-sheet px-2.5 py-0.5">
          {sellingPro ? "Coming to Pro" : "Coming soon"}
        </span>
        <h2 className="band-title mt-3">A travel agent in your pocket.</h2>
      </div>
      <div className="mt-12">
        <AgentScene />
      </div>
    </div>
  );
}
