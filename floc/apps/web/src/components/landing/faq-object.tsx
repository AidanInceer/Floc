import { AvatarRow } from "@/components/system/ui";
import { Glyph } from "./landing-glyph";
import { sampleGroup, sampleStops } from "./sample-trip";

export function FaqObject({ kind }: { kind: string }) {
  if (kind === "free") return (
    <div className="landing-faq-preview bg-pastel-yellow text-pastel-yellow-ink">
      <div className="flex items-center justify-between gap-3 font-display text-[28px] tracking-tight">
        <span>Sicily, together.</span><Glyph name="pin" className="size-6 shrink-0" />
      </div>
      <div className="landing-faq-stops">
        {sampleStops.map((stop) => <span key={stop.no}>{stop.name}</span>)}
      </div>
      <div className="mt-4 flex justify-between gap-3 text-[11px]">
        <span className="font-mono">{sampleGroup.length} people · 7 days</span><span>Free for the group</span>
      </div>
    </div>
  );
  if (kind === "account") return (
    <div className="landing-faq-preview flex flex-col items-center justify-center gap-2">
      <AvatarRow people={sampleGroup} max={6} size={36} />
      <span className="font-display text-[21px] tracking-tight">You’re invited to Sicily.</span>
      <span className="text-[11px] text-ink-soft">Preview before signing up</span>
    </div>
  );
  if (kind === "booking") return (
    <div className="landing-faq-preview bg-pastel-red text-pastel-red-ink">
      <div className="flex items-center gap-2.5 font-display text-base"><Glyph name="files" className="size-[22px] shrink-0" />Our stay in Cefalù</div>
      <div className="mt-5 flex justify-between gap-2 text-[11px]"><span>Booking confirmation</span><span className="font-mono">PDF</span></div>
      <div className="mt-2.5 border-t border-dashed border-current pt-2.5 text-[11px]">Saved to the trip</div>
    </div>
  );
  if (kind === "money") return (
    <div className="landing-faq-preview bg-pastel-green text-pastel-green-ink">
      <span className="text-xs">Priya pays Sam</span>
      <strong className="mt-2 block font-mono text-[32px] font-normal leading-tight">£42.50</strong>
      <div className="mt-3 flex justify-between border-t border-dashed border-current pt-2.5 text-[11px]"><span>Paid outside Floc</span><Glyph name="check" /></div>
    </div>
  );
  if (kind === "pro") return (
    <div className="landing-faq-preview bg-pro text-pro-ink">
      <div className="flex items-center gap-4"><Glyph name="weather" className="size-9 shrink-0" /><div><span className="block text-xs">Cefalù</span><strong className="font-mono text-[27px] font-normal">24°</strong></div></div>
      <div className="mt-3.5 flex flex-wrap justify-between gap-2.5 border-t border-dashed border-current pt-3 text-[10px]"><span>On the packing list</span><span className="flex items-center gap-1.5"><Glyph name="check" />Suncream</span></div>
    </div>
  );
  return null;
}
