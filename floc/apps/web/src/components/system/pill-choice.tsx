import type { ReactNode } from "react";

import { ButtonLink, cx } from "@/components/system/ui";

export type PillOption = { key: string; label: string; href: string };

export function PillChoice({
  icon,
  label,
  options,
  current,
  className,
}: {
  icon: ReactNode;
  label: string;
  options: PillOption[];
  current: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cx("flex flex-wrap items-center gap-2", className)}>
      {icon}
      {options.map((o) => (
        <ButtonLink
          key={o.key}
          href={o.href}
          scroll={false}
          variant={o.key === current ? "primary" : "secondary"}
          aria-current={o.key === current ? "true" : undefined}
        >
          {o.label}
        </ButtonLink>
      ))}
    </nav>
  );
}
