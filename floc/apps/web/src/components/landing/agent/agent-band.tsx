import { AgentScene } from "./agent-scene";
import { WhileYouWait } from "./while-you-wait";

/** The pocket travel agent: not built yet, so the band says it is coming, and offers the assistants people already use. */
export function AgentBand({ sellingPro, origin }: { sellingPro: boolean; origin: string }) {
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
      <WhileYouWait origin={origin} />
    </div>
  );
}
