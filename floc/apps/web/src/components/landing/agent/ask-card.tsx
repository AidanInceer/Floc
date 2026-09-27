import { Fragment } from "react";

import { Avatar, cx } from "@/components/system/ui";
import type { MarkId, TypedPrompt } from "@/lib/landing/agent/agent-prompt";

import { Glyph } from "../landing-glyph";
import { priya } from "../sample-trip";

// Each ask wears the colour of what it becomes. The route is marked by the dashed route line itself.
const MARK_TONE: Record<MarkId, string> = {
  1: "agent-mark-blue",
  2: "agent-mark-route",
  3: "agent-mark-ticket",
  4: "agent-mark-red",
  5: "agent-mark-yellow",
  6: "agent-mark-green",
};

type Props = {
  t: number;
  prompt: TypedPrompt;
  sentAt: number;
  pressedUntil: number;
  doneAt: number;
  /** The asks lit so far; none when the scene plays as lanes. */
  lit: (mark: MarkId) => boolean;
};

function State({ t, sentAt, doneAt }: { t: number; sentAt: number; doneAt: number }) {
  if (t >= doneAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-green">
        <Glyph name="check" className="size-3" />
        Planned
      </span>
    );
  }
  if (t >= sentAt) return <span className="agent-working inline-flex items-center gap-1.5 text-pen">Planning</span>;
  return <span className="text-ink-faint">New trip</span>;
}

/** Priya's brief to Floc, typing itself one key at a time. Every key is laid out from the start, so nothing reflows as it types. */
export function AskCard({ t, prompt, sentAt, pressedUntil, doneAt, lit }: Props) {
  const chars = prompt.lines.flat().flatMap((p) => p.chars);
  const typing = t >= (chars[0]?.at ?? 0) && t < prompt.endMs;
  const lastOn = typing ? chars.filter((c) => c.at <= t).at(-1) : undefined;
  const send = t >= sentAt ? (t < pressedUntil ? "is-pressed" : "is-sent") : typing && "is-ready";

  return (
    <div data-ask className="relative rounded-[20px] border border-rule bg-sheet px-[18px] pb-3 pt-3.5 shadow-lifted min-[1200px]:px-5 min-[1200px]:pb-3.5 min-[1200px]:pt-4">
      <div className="flex items-center gap-2 text-ink-soft">
        <Glyph name="agent" />
        <span className="typed text-ink-soft">Ask Floc</span>
        <span className="ml-auto font-mono text-[11px] tracking-[0.04em]">
          <State t={t} sentAt={sentAt} doneAt={doneAt} />
        </span>
      </div>
      <p className={cx("agent-ask-text relative mb-3.5 mt-3 text-[15px] leading-[1.62] text-ink min-[1200px]:mb-4 min-[1200px]:mt-3.5 min-[1200px]:text-[16.5px]", t < (chars[0]?.at ?? 0) && "is-empty")}>
        {prompt.lines.map((line, l) => (
          <span key={l} className="block">
            {line.map((part, p) => {
              const keys = part.chars.map((c, k) => (
                <span key={k} className={cx("agent-ch", t >= c.at && "is-on", c === lastOn && "is-last")}>
                  {c.ch}
                </span>
              ));
              if (!part.mark) return <Fragment key={p}>{keys}</Fragment>;
              return (
                <span key={p} data-mark={part.mark} className={cx("agent-mark", MARK_TONE[part.mark], lit(part.mark) && "is-lit")}>
                  {keys}
                </span>
              );
            })}
          </span>
        ))}
      </p>
      <div className="flex items-center justify-between border-t border-rule pt-3">
        <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
          <Avatar name={priya.name} tone={priya.tone} size={22} />
          {priya.name}
        </span>
        <span className={cx("agent-send grid size-[34px] place-items-center rounded-full", send)}>
          <Glyph name="send" className="size-[15px]" />
        </span>
      </div>
    </div>
  );
}
