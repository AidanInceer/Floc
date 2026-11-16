"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/system/client-ui";

import { sendSampleToMe, type SendResult } from "@/app/dev/emails/actions";

export function SendSample({ sampleKey }: { sampleKey: string }) {
  const [result, action] = useActionState(sendSampleToMe, null as SendResult);
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="key" value={sampleKey} />
      {result ? <span className="font-mono text-xs text-ink-2" role="status">{result}</span> : null}
      <SubmitButton variant="secondary">Send to me</SubmitButton>
    </form>
  );
}
