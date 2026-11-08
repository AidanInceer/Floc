import { Badge } from "@/components/system/ui";

/** Drawn for the dark Pro band: a hairline outline in the slab's own ink, no white fill. */
export function ComingSoonTag() {
  return (
    <Badge className="h-6 justify-center border-dashed !border-[color-mix(in_srgb,var(--slab-ink)_45%,transparent)] !bg-transparent py-0 text-[10px] leading-none !text-[color-mix(in_srgb,var(--slab-ink)_75%,transparent)]">
      Coming soon to Pro
    </Badge>
  );
}
