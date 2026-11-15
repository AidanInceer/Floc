"use client";

import { useState } from "react";

import { CONSENT_CATEGORIES, type ConsentChoice } from "@floc/core/consent/consent";

import { ToggleRow } from "@/components/auth/account-ui";
import { Button } from "@/components/system/ui";
import { chooseConsent } from "@/lib/consent/consent-cookie";

import { useConsent } from "./use-consent";

/** The same choice as the banner, one switch each, changeable at any time from the Cookies page (#368). */
export function ConsentChoices({ fromServer }: { fromServer: ConsentChoice | null }) {
  const consent = useConsent(fromServer);
  const [saved, setSaved] = useState(false);

  return (
    <form
      // Why the key: the switches are plain checkboxes, so a choice made on the banner must redraw them.
      key={`${consent?.functional}-${consent?.analytics}`}
      className="flex flex-col items-start gap-4"
      onChange={() => setSaved(false)}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        chooseConsent({ functional: form.has("functional"), analytics: form.has("analytics") });
        setSaved(true);
      }}
    >
      {CONSENT_CATEGORIES.map((category) => (
        <ToggleRow
          key={category.key}
          name={category.key}
          label={category.label}
          hint={category.detail}
          disabled={category.key === "necessary"}
          defaultChecked={category.key === "necessary" || Boolean(consent?.[category.key])}
        />
      ))}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary">Save</Button>
        {saved ? <p role="status" className="text-sm text-ink-soft">Saved.</p> : null}
      </div>
    </form>
  );
}
