/**
 * The wordmark: three chevrons in a V — the flock, and the "who's coming" of a
 * trip — then the display face lowercase with the one blue dot that carries
 * through the product as "yours". The chevrons are the only part that can leave
 * the bar, so they carry the favicon and the app icon too. Shared by the top
 * chrome and the site footer.
 */
export function FlocWordmark() {
  return (
    <span className="inline-flex items-center gap-1.5 font-display text-[15px] font-semibold leading-none tracking-tight text-ink sm:text-[22px]">
      <svg
        viewBox="0 0 26 20"
        aria-hidden="true"
        className="h-[14px] w-[18px] shrink-0 text-pen sm:h-5 sm:w-[25px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 14 6.5 10.5 10 14" />
        <path d="M9.5 8.5 13 5 16.5 8.5" />
        <path d="M16 14 19.5 10.5 23 14" />
      </svg>
      <span>
        floc<span className="text-pen">.</span>
      </span>
    </span>
  );
}
