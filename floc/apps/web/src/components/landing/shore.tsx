/** A wavy edge between two page bands. The fill is the band above; rotate it to fill the band below. */
export function Shore({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 1440 80" preserveAspectRatio="none" className={`block h-14 w-full sm:h-24 ${className}`}>
      <path d="M0 0H1440V78C1370 70 1300 8 1190 6C1070 4 990 72 860 72C730 72 660 14 530 14C400 14 320 70 200 70C110 70 50 30 0 20Z" />
    </svg>
  );
}
