import type { DatesMoment } from "../../dates/dates-moment";

export const NUDGE_TASKS = ["dates", "money", "ideas"] as const;
export type NudgeTask = (typeof NUDGE_TASKS)[number];

export const NUDGE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const NUDGE_TODO: Record<NudgeTask, string> = {
  dates: "mark your days",
  money: "settle up",
  ideas: "vote on where to go",
};

export type NudgePerson = { userId: string; name: string; nudged: boolean };
export type NudgeTargets = Record<NudgeTask, NudgePerson[]>;

export type NudgeTargetsInput = {
  viewerId: string;
  moment: DatesMoment;
  members: { userId: string; name: string }[];
  recent: { task: string; toUserId: string }[];
  markedUserIds?: string[];
  ideas?: { count: number; voterIds: string[] };
  owedBy?: string[];
};

export function readNudgeTask(value: unknown): NudgeTask | null {
  return (NUDGE_TASKS as readonly unknown[]).includes(value) ? (value as NudgeTask) : null;
}

export function nudgeTargets(input: NudgeTargetsInput): NudgeTargets {
  const others = input.members.filter((m) => m.userId !== input.viewerId);
  const finding = input.moment === "finding";
  const pick = (task: NudgeTask, keep: (userId: string) => boolean): NudgePerson[] =>
    others
      .filter((m) => keep(m.userId))
      .map((m) => ({
        userId: m.userId,
        name: m.name,
        nudged: input.recent.some((r) => r.task === task && r.toUserId === m.userId),
      }));
  const marked = new Set(input.markedUserIds ?? []);
  const voted = new Set(input.ideas?.voterIds ?? []);
  const owing = new Set(input.owedBy ?? []);
  return {
    dates: finding && input.markedUserIds ? pick("dates", (id) => !marked.has(id)) : [],
    money: pick("money", (id) => owing.has(id)),
    ideas: finding && input.ideas && input.ideas.count > 0 ? pick("ideas", (id) => !voted.has(id)) : [],
  };
}

export function nudgePlan(people: NudgePerson[], asked: string[], sentToday: number, cap: number): { send: string[]; capped: boolean } {
  const open = new Set(people.filter((p) => !p.nudged).map((p) => p.userId));
  const wanted = [...new Set(asked)].filter((id) => open.has(id));
  const room = Math.max(0, cap - sentToday);
  return { send: wanted.slice(0, room), capped: wanted.length > room };
}

const LINES: Record<NudgeTask, [string, string]> = {
  dates: ["has not marked any days", "have not marked any days"],
  money: ["owes you", "owe you"],
  ideas: ["has not voted on where", "have not voted on where"],
};

export function nudgeLine(task: NudgeTask, count: number): string {
  return count === 1 ? `1 person ${LINES[task][0]}` : `${count} people ${LINES[task][1]}`;
}

export function nudgeHref(tripId: number, task: NudgeTask): string {
  return task === "ideas" ? `/trip/${tripId}/overview#ideas` : `/trip/${tripId}/${task}`;
}

export type NudgeResult = { sent: number; capped: boolean };
