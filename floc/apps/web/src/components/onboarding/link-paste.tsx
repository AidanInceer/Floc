"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readInviteLink } from "@floc/core/people/welcome/link-join";

import { Button, ErrorText, Field, Input } from "@/components/system/ui";

export function LinkPaste({ before }: { before?: () => Promise<void> }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [wrong, setWrong] = useState(false);
  const open = async () => {
    const token = readInviteLink(text);
    if (!token) return setWrong(true);
    await before?.();
    router.push(`/invite/${token}`);
  };
  return (
    <div className="grid gap-1.5">
      <Field label="Invite link">
        <span className="flex gap-2">
          <Input
            value={text}
            inputMode="url"
            autoComplete="off"
            onChange={(event) => {
              setText(event.target.value);
              setWrong(false);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              void open();
            }}
          />
          <Button type="button" variant="primary" disabled={!text.trim()} onClick={() => void open()}>
            Open
          </Button>
        </span>
      </Field>
      <ErrorText>{wrong ? "That isn’t a Floc invite link. It has /invite/ in it." : null}</ErrorText>
    </div>
  );
}
