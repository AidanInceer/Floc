import type { AvatarIcon } from "@floc/core/people/avatar-icon";

export type TripRole = "admin" | "member";

export type TripSummary = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  tags: string[] | null;
  colorKey: string | null;
  mark: string | null;
  role: TripRole;
  starred: boolean;
  muted: boolean;
  members: TripFace[];
  needsYou: boolean;
  where: string | null;
};

export type TripFace = { userId: string; name: string; avatarIcon: AvatarIcon | null; tone: string };
