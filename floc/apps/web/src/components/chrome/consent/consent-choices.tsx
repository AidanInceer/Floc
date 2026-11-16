"use client";

import { useState } from "react";

import { CONSENT_CATEGORIES, type ConsentChoice } from "@floc/core/consent/consent";

import { ToggleRow } from "@/components/auth/account-ui";
import { Button } from "@/components/system/ui";
import { chooseConsent } from "@/lib/consent/consent-cookie";

import { useConsent } from "./use-consent";

export function ConsentRows({ consent }: { consent: ConsentChoice | null }) {
  return CONSENT_CATEGORIES.map((category) =>
    category.key === "necessary" ? (
      <div key={category.key} className="flex items-start gap-3">
        <span className="switch-track invisible" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 text-sm">
            {category.label}
            <span className="rounded-sm border border-rule px-1.5 text-xs text-ink-2">Always active</span>
          </span>
          <span className="mt-0.5 block text-xs text-ink-soft [text-wrap:pretty]">{category.detail}</span>
        </span>
      </div>
    ) : (
      <ToggleRow key={category.key} name={category.key} label={category.label} hint={category.detail} defaultChecked={Boolean(consent?.[category.key])} />
    ),
  );
}

export function ConsentChoices({ fromServer }: { fromServer: ConsentChoice | null }) {
  const consent = useConsent(fromServer);
  const [saved, setSaved] = useState(false);

  return (
    <form
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
      <ConsentRows consent={consent} />
      <div className="flex items-center gap-3">
        <Button type="submit">Save preferences</Button>
        {saved ? <p role="status" className="text-sm text-ink-soft">Your preferences have been saved.</p> : null}
      </div>
    </form>
  );
}
