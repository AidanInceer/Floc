import type { ReactNode } from "react";

import { PRO_FEATURES, type ProFeatureKey } from "@floc/core/billing/pro-features";
import { PAGE_ICON_ART } from "@floc/core/notes/pages/page-icons";

import { IconArtMark } from "@/components/system/icon-art";
import { KnowGlyphIcon } from "@/components/system/icons/know";
import { Glyph, type GlyphName } from "@/components/system/icons/landing";
import { NavGlyph } from "@/components/system/icons/nav";
import { WeatherGlyph } from "@/components/system/icons/weather";
import { proPlans, type PlanPrice } from "@/lib/landing/pro-plans";

import { ProPriceCard } from "./pro-price-card";
import "./pro-band.css";

type Item = { icon: ReactNode; name: string; eg: ReactNode };

const glyph = (name: GlyphName) => <Glyph name={name} className="size-[14px]" />;

const LOOK: Record<ProFeatureKey, { icon: ReactNode; tone: "red" | "yellow" | "green" | "blue" | "grey" }> = {
  "money.estimate": { icon: <NavGlyph name="money" />, tone: "red" },
  "dates.weather": { icon: <WeatherGlyph condition="sun" size={14} />, tone: "yellow" },
  "packing.autoGenerate": { icon: <NavGlyph name="packing" />, tone: "blue" },
  "bookings.autoFile": { icon: glyph("mail"), tone: "green" },
  "files.extraStorage": { icon: <NavGlyph name="files" />, tone: "grey" },
};

const NOW = PRO_FEATURES.map((f) => ({ ...LOOK[f.key], name: f.name, eg: f.detail }));

const SOON: Item[] = [
  { icon: glyph("live"), name: "Follow the trip live", eg: "Share where you are with the group while the trip runs." },
  { icon: <KnowGlyphIcon name="chat" size={14} />, name: "Plan with a travel partner", eg: "It suggests days, compares options and adds them to the trip." },
  { icon: glyph("local"), name: "Find places nearby", eg: "Picks near each night's stay, for the group and the weather." },
  { icon: glyph("offline"), name: "Use it offline", eg: "Open your trip on the plane." },
  { icon: <IconArtMark art={PAGE_ICON_ART.camera} size={14} />, name: "Scan a receipt", eg: "Take a photo and the cost goes into Money." },
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
                Everyone on the trip uses Floc free. Pro adds tools that only you see.
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
          <ul className="pro-soon grid gap-3 md:flex md:flex-wrap">
            {SOON.map((item) => <Row key={item.name} item={item} tile="pro-tile-soon" />)}
          </ul>
        </section>
      </div>
    </section>
  );
}
