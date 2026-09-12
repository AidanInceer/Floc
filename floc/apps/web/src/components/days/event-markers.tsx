/**
 * The marks a calendar block wears (tickets 103, 324) — a note on it, files on
 * it. Both views draw the same pair. `aria-hidden`: they say only "more
 * inside", and the modal is the real answer.
 */

export function EventMarkers({
  hasNote,
  hasFiles,
}: {
  hasNote: boolean;
  hasFiles: boolean;
}) {
  return (
    <>
      {hasNote ? <span aria-hidden> &#9998;</span> : null}
      {hasFiles ? <ClipGlyph /> : null}
    </>
  );
}

function ClipGlyph() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="ml-0.5 inline-block align-[-0.08em]"
    >
      <path d="M10.5 6.5 6 11a2.6 2.6 0 0 1-3.7-3.7l5.2-5.2a1.7 1.7 0 0 1 2.4 2.4L4.7 9.7a.8.8 0 0 1-1.2-1.2l4.6-4.6" />
    </svg>
  );
}
