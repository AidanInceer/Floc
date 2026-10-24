"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { guestStart } from "@/app/invite/[token]/actions";
import { Button, ErrorText, Field, Input } from "@/components/system/ui";
import { TEXT_CAPS } from "@floc/core/text/text";

/** A name and nothing else (#442, ADR-029); the account is the other way in, under it. */
export function GuestStart({ token, children }: { token: string; children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="grid gap-5">
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const name = String(new FormData(event.currentTarget).get("name") ?? "");
          startTransition(async () => {
            const result = await guestStart(token, name);
            setError(result.error ?? null);
            // Why: the guest cookie is set in this action's response; the page re-reads who is looking.
            if (!result.error) router.refresh();
          });
        }}
      >
        <Field label="Your name" hint="The group sees it next to your answers.">
          <Input name="name" autoFocus autoComplete="given-name" maxLength={TEXT_CAPS.displayName} required />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" variant="primary" className="w-full" disabled={pending}>
          {pending ? "One moment…" : "Continue"}
        </Button>
      </form>
      <div className="typed flex items-center gap-3 text-ink-faint">
        <span className="h-px flex-1 bg-rule" />
        or
        <span className="h-px flex-1 bg-rule" />
      </div>
      {children}
    </div>
  );
}
