/**
 * Someone's face, linked to their profile (ticket 46). Every avatar on the
 * site is a way in — a trip roster, the friends list, anywhere a person
 * appears — so the wiring lives in one place rather than in each surface's
 * markup.
 *
 * The link is safe to render for anyone: a viewer outside every ring gets a
 * 404 on the other end (`requireProfileView`), which is the same answer a
 * made-up user id gets. Your own face links to /profile, not to your public
 * page — that's the one you can edit.
 */
import Link from "next/link";

import { Avatar, cx } from "@/components/system/ui";

export function PersonLink({
  userId,
  name,
  avatarUrl,
  size = 28,
  tone,
  isYou,
  className,
}: {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  size?: number;
  /** A trip member's seat colour — pass it through so it survives the link. */
  tone?: string;
  isYou?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={isYou ? "/profile" : `/profile/${userId}`}
      title={isYou ? "Your profile" : `${name}'s profile`}
      className={cx(
        "inline-flex shrink-0 rounded-full ring-offset-1 ring-offset-sheet transition-shadow hover:ring-2 hover:ring-pen",
        className,
      )}
    >
      <Avatar name={name} src={avatarUrl} size={size} tone={tone} />
    </Link>
  );
}
