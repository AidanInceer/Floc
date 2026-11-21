import type { NudgeResult, NudgeTargets, NudgeTask } from "@floc/core/trip/nudge/nudge";

export type NudgesPort = {
  nudgeTargets(viewerId: string, tripId: number): Promise<NudgeTargets>;

  sendNudges(viewerId: string, tripId: number, task: NudgeTask, userIds: string[]): Promise<NudgeResult>;
};
