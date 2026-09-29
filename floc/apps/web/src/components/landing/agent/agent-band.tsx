import { AgentScene } from "./agent-scene";
import { WhileYouWait } from "./while-you-wait";
import { ComingSoonTag } from "../coming-soon-tag";

/** The pocket travel agent: not built yet, so the band says it is coming, and offers the assistants people already use. */
export function AgentBand({ origin }: { origin: string }) {
  return (
    <div>
      <div className="grid justify-items-center text-center">
        <ComingSoonTag />
        <h2 className="band-title mt-3">A travel agent in your pocket.</h2>
      </div>
      <div className="mt-12">
        <AgentScene />
      </div>
      <WhileYouWait origin={origin} />
    </div>
  );
}
