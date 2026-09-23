import "server-only";

import type { FriendSearch } from "@floc/api/port";
import { readFriendQuery } from "@floc/core/people/friend-query";

import { findByName } from "@/server/social/find-friends";
import { findByCode } from "@/server/social/friend-code";

/** Read-only, whatever was typed: asking is always a second, deliberate press. */
export async function searchFriends(viewerId: string, text: string): Promise<FriendSearch> {
  const query = readFriendQuery(text);
  if (!query) return { kind: "invalid" };
  switch (query.kind) {
    case "code":
      return { kind: "code", code: query.code, person: await findByCode(viewerId, query.code) };
    case "name":
      return { kind: "people", people: await findByName(viewerId, query.name) };
  }
}
