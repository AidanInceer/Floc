"use client";

import { useState, useTransition } from "react";

import { answerConnect } from "@/app/connect/actions";
import { Button, ButtonLink, ErrorText, busyMark } from "@/components/system/ui";

export function ConnectChoice({ oauthQuery }: { oauthQuery: string }) {
  const [pending, start] = useTransition();
  const [picked, setPicked] = useState<boolean | null>(null);
  const [left, setLeft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answer = (accept: boolean) => {
    setPicked(accept);
    start(async () => {
      const result = await answerConnect(oauthQuery, accept);
      if (result.url) {
        setLeft(true);
        window.location.assign(result.url);
      } else {
        setError(result.error ?? "This request has ended. Start again from the app.");
      }
    });
  };

  if (left) return <p role="status" className="text-sm text-ink-soft">Sent back to the app. You can close this page.</p>;

  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <ErrorText>{error}</ErrorText>
        <ButtonLink href="/trips" className="w-full">Back to your trips</ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button className="flex-1" disabled={pending} onClick={() => answer(false)}>
        Cancel{busyMark(pending && picked === false)}
      </Button>
      <Button variant="primary" className="flex-1" disabled={pending} onClick={() => answer(true)}>
        Allow{busyMark(pending && picked === true)}
      </Button>
    </div>
  );
}
