/**
 * Why: the listing page reads your currency and the day's rates before it can draw, so without a boundary
 * a tile click on Explore looked ignored. This also gives Next a prefetchable shell for the route.
 */
export default function ExploreTripLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="mx-auto w-full max-w-[84rem] px-4 pb-32 pt-6 sm:px-6">
      <span className="typed">Loading…</span>
      <div aria-hidden className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="aspect-[4/3] rounded-md bg-sheet opacity-80" />
        <div className="flex flex-col gap-4">
          <div className="h-12 w-[16ch] rounded-md bg-sheet-3 opacity-70" />
          <div className="h-20 rounded-md bg-sheet opacity-80" />
          <div className="h-24 rounded-md bg-sheet opacity-80" />
        </div>
      </div>
    </div>
  );
}
