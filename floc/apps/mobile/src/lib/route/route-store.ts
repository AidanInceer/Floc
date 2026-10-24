// Why: a file, not memory — the background task can run in a fresh JS context after the app was swiped away.
import { File, Paths } from "expo-file-system";

import type { Queued, Tracking } from "./route-queue";

type Stored = { tracking: Tracking | null; queue: Queued[] };

const file = () => new File(Paths.document, "route.json");

export async function readRoute(): Promise<Stored> {
  try {
    const f = file();
    if (!f.exists) return { tracking: null, queue: [] };
    const parsed = JSON.parse(await f.text()) as Partial<Stored>;
    return { tracking: parsed.tracking ?? null, queue: parsed.queue ?? [] };
  } catch {
    return { tracking: null, queue: [] };
  }
}

export async function writeRoute(next: Stored): Promise<void> {
  const f = file();
  if (!f.exists) f.create();
  f.write(JSON.stringify(next));
}
