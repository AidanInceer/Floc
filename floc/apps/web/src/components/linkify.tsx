/**
 * An idea is free text, so a link arrives inside it rather than in a field of
 * its own (ticket 196). `rel` is belt and braces — the href is another member's
 * typing, not the app's.
 */
const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

export function linkify(note: string) {
  return note.split(URL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className="text-pen underline underline-offset-2 hover:text-pen-deep"
      >
        {part.replace(/^https?:\/\//, "")}
      </a>
    ) : (
      part
    ),
  );
}
