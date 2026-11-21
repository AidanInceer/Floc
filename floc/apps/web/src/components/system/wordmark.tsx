export function FlocWordmark() {
  return (
    <span className="inline-flex items-center gap-1.5 font-display text-[15px] font-bold leading-none tracking-tight text-ink sm:text-[22px]">
      <FlocMark className="h-[14px] w-[18px] shrink-0 text-pen sm:h-5 sm:w-[25px]" />
      <span data-fuse="word" className="-mb-1 -mr-px -mt-[3px] inline-flex pb-1 pr-px pt-[3px]">
        <span data-fuse-in>
          floc<span className="text-pen">.</span>
        </span>
      </span>
    </span>
  );
}

export function FlocMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 22"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.4 16.5 7 12.9 10.6 16.5" />
      <path d="M10.4 10 14 6.4 17.6 10" />
      <path d="M17.4 16.5 21 12.9 24.6 16.5" />
    </svg>
  );
}

export function FlocWord() {
  return (
    <span className="font-display font-extrabold tracking-tight text-ink">
      floc<span className="text-pen">.</span>
    </span>
  );
}
