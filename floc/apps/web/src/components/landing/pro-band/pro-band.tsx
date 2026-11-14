import type { ReactNode } from "react";

import { Glyph, type GlyphName } from "@/components/system/icons/landing";
import { proPlans, type PlanPrice } from "@/lib/landing/pro-plans";

import { ProPriceCard } from "./pro-price-card";
import "./pro-band.css";

type Item = { icon: ReactNode; name: string; eg: ReactNode };

const glyph = (name: GlyphName) => <Glyph name={name} className="size-[14px]" />;
const n = (s: string) => <span className="nums">{s}</span>;

const NOW: (Item & { tone: "yellow" | "green" | "blue" | "grey" })[] = [
  { icon: glyph("weather"), tone: "yellow", name: "Weather on your dates", eg: <>Etna on Monday: {n("14°")}</> },
  { icon: glyph("flight"), tone: "green", name: "Searches filled in", eg: <>Skyscanner opens on {n("LGW to PMO, 12 Sep, 6 adults")}</> },
  { icon: glyph("packing"), tone: "blue", name: "Packing from the forecast", eg: "A jumper goes on your list for Etna" },
  { icon: glyph("files"), tone: "grey", name: "1 GB of your own files", eg: <>Every booking in one place, {n("38 MB")} used</> },
];

const SOON: Item[] = [
  { icon: glyph("tag"), name: "Price watch", eg: "Hear when your flights get cheaper." },
  { icon: glyph("offline"), name: "Works with no signal", eg: "Your trip opens on the plane." },
  { icon: glyph("receipt"), name: "Snap the bill", eg: "A photo of the receipt goes into Money." },
];

function Row({ item, tile }: { item: Item; tile: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`pro-tile ${tile}`}>{item.icon}</span>
      <p className="grid min-w-0">
        <b className="text-[16px] font-semibold">{item.name}</b>
        <span className="pro-eg">{item.eg}</span>
      </p>
    </li>
  );
}

/** Pro is personal (ADR-041): it adds to the buyer's own screen, and the trip stays free for the group. */
export function ProBand({ prices, signedIn }: { prices: PlanPrice[]; signedIn: boolean }) {
  const { plans, initial } = proPlans(prices);
  return (
    <section className="pro-slab mt-24" aria-labelledby="pro-band-h">
      <div className="mx-auto w-full max-w-[84rem] px-4 sm:px-6">
        <div className="grid gap-8 min-[60rem]:grid-cols-[1fr_22rem] min-[60rem]:items-center min-[60rem]:gap-14">
          <div>
            <div className="mb-8 max-w-[36rem]">
              <h2 id="pro-band-h" className="band-title text-balance">Pro, for anyone who wants it.</h2>
              <p className="mt-3.5 max-w-[30rem] text-[17px] leading-normal opacity-75">
                The trip stays free for the whole group. Pro adds four things to your own screen.
              </p>
            </div>
            <h3 className="mb-3.5 text-[16px] font-semibold">In Pro now</h3>
            <ul className="grid gap-3.5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-[18px]">
              {NOW.map((item) => <Row key={item.name} item={item} tile={`pro-tone-${item.tone}`} />)}
            </ul>
          </div>
          <ProPriceCard plans={plans} initial={initial} href={signedIn ? "/profile?section=billing#settings-billing" : "/signup"} />
        </div>
        <section className="mt-10" aria-labelledby="pro-soon-h">
          <h3 id="pro-soon-h" className="mb-4 font-display text-[22px] font-semibold tracking-[-0.01em]">
            Coming soon to Pro
          </h3>
          <ul className="pro-soon grid gap-3 md:grid-cols-3">
            {SOON.map((item) => <Row key={item.name} item={item} tile="pro-tile-soon" />)}
          </ul>
        </section>
      </div>
    </section>
  );
}
