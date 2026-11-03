"use client";

import { useState } from "react";

import { Menu } from "@/components/system/client-ui";
import { buttonClass, cx, menuItemClass } from "@/components/system/ui";

export function CalendarMenu({
  downloadHref,
  feedUrl,
}: {
  downloadHref: string;
  feedUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Menu
      label="Add to calendar"
      trigger="Add to calendar"
      triggerClassName={cx(buttonClass(), "shrink-0 whitespace-nowrap data-[open=true]:bg-pen-soft")}
    >
      <button
        type="button"
        role="menuitem"
        className={menuItemClass}
        onClick={async () => {
          await navigator.clipboard.writeText(feedUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }}
      >
        {copied ? "Link copied" : "Keep in sync"}
        <span className="block text-xs text-ink-faint">
          {copied
            ? "Paste it into Google, Apple or Outlook calendar"
            : "Copies a link for Google, Apple or Outlook calendar"}
        </span>
      </button>
      <a role="menuitem" href={downloadHref} download className={menuItemClass}>
        Download a copy
        <span className="block text-xs text-ink-faint">Does not update when plans change</span>
      </a>
    </Menu>
  );
}
