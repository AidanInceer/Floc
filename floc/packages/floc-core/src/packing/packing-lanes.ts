export function arrangePackingLanes<
  T extends { claims: readonly { userId: string }[] },
  M extends { userId: string },
>(
  lines: readonly T[],
  members: readonly M[],
): {
  open: T[];
  people: { member: M; lines: T[] }[];
  former: T[];
} {
  const memberIds = new Set(members.map((member) => member.userId));
  return {
    open: lines.filter((line) => line.claims.length === 0),
    people: members.map((member) => ({
      member,
      lines: lines.filter((line) => line.claims.some((claim) => claim.userId === member.userId)),
    })),
    former: lines.filter((line) =>
      line.claims.some((claim) => !memberIds.has(claim.userId)),
    ),
  };
}
