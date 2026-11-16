export type MemberAction = "profile" | "promote" | "remove";

export function memberActions({ viewerIsAdmin, you, role }: { viewerIsAdmin: boolean; you: boolean; role: string }): MemberAction[] {
  if (you) return [];
  const out: MemberAction[] = ["profile"];
  if (viewerIsAdmin && role !== "admin") out.push("promote");
  if (viewerIsAdmin) out.push("remove");
  return out;
}
