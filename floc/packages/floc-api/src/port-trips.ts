/** The trip list's row (#289): what a card on either client draws, never more. */
import type { AvatarIcon } from "@floc/core/people/avatar-icon";

import type { TripRole } from "./port";

export type TripSummary = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  tags: string[] | null;
  colorKey: string | null;
  /** The chosen mark, or null for the pastel alone (#318). Never a URL. */
  mark: string | null;
  role: TripRole;
  /** The viewer's own star — never another member's. */
  starred: boolean;
  /** The viewer's own mute: no push or email from this trip (#346). */
  muted: boolean;
  /** The faces for the card's avatar row — name, icon and seat colour only, never an email. */
  members: TripFace[];
  /** No dates and nowhere to stay yet — the web card's "Needs you". */
  needsYou: boolean;
  /** The first night's place, or null before one is set. */
  where: string | null;
};

export type TripFace = { userId: string; name: string; avatarIcon: AvatarIcon | null; tone: string };
