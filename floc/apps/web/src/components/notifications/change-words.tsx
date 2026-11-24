export function ChangeWords({ words }: { words: { was: string | null; now: string | null } }) {
  return (
    <span className="nums flex flex-wrap gap-x-2 text-xs text-ink-soft">
      {words.was ? <s className="text-ink-faint">{words.was}</s> : null}
      {words.now ? <span>{words.now}</span> : null}
    </span>
  );
}
