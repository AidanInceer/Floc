import Link from "next/link";

/** A stop with a hotel file hangs a ribbon from its card. No visible word: the Bookings card beside it names the file. */
export function StopRibbon({ tripId, fileName }: { tripId: number; fileName: string }) {
  const label = `Booked: ${fileName}`;
  return (
    <Link href={`/trip/${tripId}/files`} title={label} aria-label={label} className="group absolute -top-px right-4 px-1 pb-1">
      <span className="block h-[30px] w-4 bg-pastel-green-ink transition-colors group-hover:bg-ink [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-6px),0_100%)]" />
    </Link>
  );
}
