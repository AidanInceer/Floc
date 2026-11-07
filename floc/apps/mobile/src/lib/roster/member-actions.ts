export type MemberAction = "profile" | "promote" | "remove";

/** Why: hiding a control is a courtesy; the API still refuses a non-admin (rule 6). */
export function memberActions({ viewerIsAdmin, you, role }: { viewerIsAdmin: boolean; you: boolean; role: string }): MemberAction[] {
  if (you) return [];
  const out: MemberAction[] = ["profile"];
  if (viewerIsAdmin && role !== "admin") out.push("promote");
  if (viewerIsAdmin) out.push("remove");
  return out;
}
