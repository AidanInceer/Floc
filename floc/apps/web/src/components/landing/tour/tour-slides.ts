import { SECTION_COLOURS, type SectionColour } from "@floc/core/design/section-colours";
import type { GlyphName } from "@/components/system/icons/landing";
import type { TabState } from "@/lib/tabs";

export type SlideTone = SectionColour;

export type TourSlide = {
  key: string;
  tab: string;
  icon: GlyphName;
  tone: SlideTone;
  /** The trip tab the drawn page sits on. */
  page: TabState["key"];
  title: string;
  line: string;
  /** The group-chat line this slide replaces. */
  before: string;
  proExtra?: string;
};

// In trip order: picking a place, then the week, the days, the bills, the bags, the notes and the passes.
export const TOUR_SLIDES: TourSlide[] = [
  {
    key: "where",
    tab: "Where",
    icon: "local",
    page: "overview",
    tone: SECTION_COLOURS.overview,
    title: "Decide where, together",
    line: "Everyone puts up an idea. The group votes one to the top.",
    before: "i sent a link last week somewhere",
  },
  {
    key: "when",
    tab: "When",
    icon: "dates",
    page: "dates",
    tone: SECTION_COLOURS.dates,
    title: "Find the week everyone can make",
    line: "Everyone shades their free days once. The weeks that work for all six show up.",
    before: "september? not the second week",
  },
  {
    key: "plan",
    tab: "The plan",
    icon: "pin",
    page: "days",
    tone: SECTION_COLOURS.days,
    title: "The plan is the route",
    line: "Where you sleep each night, drawn on the map as you go. The one thing each day, or every hour, if that’s you.",
    before: "what are we doing tuesday",
  },
  {
    key: "money",
    tab: "Money",
    icon: "money",
    page: "money",
    tone: SECTION_COLOURS.money,
    title: "Split the bill, not the group",
    line: "Log what you paid. Everyone gets one number.",
    before: "flat was 960, send me your bit",
  },
  {
    key: "packing",
    tab: "Packing",
    icon: "packing",
    page: "packing",
    tone: SECTION_COLOURS.packing,
    title: "Pack once, pack right",
    line: "Claim the shared things. Nothing doubles up, nothing gets left.",
    before: "who’s bringing the speaker",
    proExtra: "Pro: a list built from the forecast and the plan",
  },
  {
    key: "notes",
    tab: "Notes",
    icon: "notes",
    page: "notes",
    tone: SECTION_COLOURS.notes,
    title: "Write it down together",
    line: "A page for the restaurants, the day trips, the house rules. Everyone writes at once.",
    before: "where was that restaurant list",
  },
  {
    key: "tickets",
    tab: "Tickets",
    icon: "files",
    page: "files",
    tone: SECTION_COLOURS.files,
    title: "Tickets, filed",
    line: "Passes and bookings live on the trip. Nobody forwards anything.",
    before: "can someone forward the boarding pass",
    proExtra: "Pro: extra trip storage, for every pass and scan",
  },
];

/** With every feature free there is no Pro to point at, so the asides go. */
export function tourSlides(sellingPro: boolean): TourSlide[] {
  return sellingPro ? TOUR_SLIDES : TOUR_SLIDES.map((s) => ({ ...s, proExtra: undefined }));
}
