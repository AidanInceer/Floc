"use client";

import { useState } from "react";

import { resetCalendarLink } from "@/app/trip/[id]/days/actions";
import { ConfirmSubmit, Menu } from "@/components/system/client-ui";
import { buttonClass, cx, menuItemClass } from "@/components/system/ui";

type ResetState = "idle" | "done" | "failed";

const RESET_CAPTION: Record<ResetState, string> = {
  idle: "The old link stops working",
  done: "Link reset. Add the new one",
  failed: "Link not reset. Try again",
};

export function CalendarMenu({
  tripId,
  downloadHref,
  feedUrl: initialFeedUrl,
}: {
  tripId: number;
  downloadHref: string;
  feedUrl: string;
}) {
  const [feedUrl, setFeedUrl] = useState(initialFeedUrl);
  const [copied, setCopied] = useState(false);
  const [reset, setReset] = useState<ResetState>("idle");

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
      <form
        action={async () => {
          const next = await resetCalendarLink(tripId).catch(() => null);
          if (next) setFeedUrl(next);
          setReset(next ? "done" : "failed");
        }}
      >
        <ConfirmSubmit
          variant="ghost"
          confirmVariant="danger"
          message="Reset your calendar link? The old link stops working in every calendar that holds it. Everyone else on the trip keeps theirs."
          confirmLabel="Reset the link"
          className={menuItemClass}
        >
          Reset link
          <span className={cx("block text-xs", reset === "failed" ? "text-red" : "text-ink-faint")}>
            {RESET_CAPTION[reset]}
          </span>
        </ConfirmSubmit>
      </form>
    </Menu>
  );
}
