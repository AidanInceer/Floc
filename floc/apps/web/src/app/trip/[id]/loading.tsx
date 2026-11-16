export default function TripTabLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6"
    >
      <span className="typed">Loading…</span>
      <div className="mt-4 flex flex-col gap-4" aria-hidden>
        <div className="h-9 w-[18ch] rounded-md bg-sheet-3 opacity-70" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-md bg-sheet opacity-80" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)]">
          <div className="h-64 rounded-md bg-sheet opacity-80" />
          <div className="h-64 rounded-md bg-sheet opacity-80" />
        </div>
      </div>
    </div>
  );
}
