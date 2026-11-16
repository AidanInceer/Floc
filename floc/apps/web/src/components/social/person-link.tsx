import Link from "next/link";

import { Avatar, cx } from "@/components/system/ui";

export function PersonLink({
  userId,
  name,
  size = 28,
  tone,
  isYou,
  className,
}: {
  userId: string;
  name: string;
  size?: number;
  tone?: string;
  isYou?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={isYou ? "/profile" : `/profile/${userId}`}
      title={isYou ? "Your profile" : `${name}'s profile`}
      className={cx(
        "inline-flex shrink-0 rounded-sm ring-offset-1 ring-offset-sheet transition-shadow hover:ring-2 hover:ring-pen",
        className,
      )}
    >
      <Avatar name={name} size={size} tone={tone} />
    </Link>
  );
}
