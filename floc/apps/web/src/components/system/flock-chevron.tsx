/**
 * The wordmark's three chevrons, reused as the product's one disclosure icon
 * (see [[wordmark]]): every fold in the app opens with the flock rather than a
 * generic caret. Points down closed; callers rotate it for the open state.
 * `currentColor` throughout — the mark's blue belongs to the wordmark alone.
 */
export function FlockChevron({
  className,
  size = 13,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 26 20"
      width={(size * 26) / 20}
      height={size}
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6 6.5 9.5 10 6" />
      <path d="M9.5 11.5 13 15 16.5 11.5" />
      <path d="M16 6 19.5 9.5 23 6" />
    </svg>
  );
}
