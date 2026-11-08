import type { TripKnow } from "../../know-types";

export const LOFOTEN_CABINS: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Norway", slug: "norway" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "sun",
          title: "Go in June for the midnight sun",
          text: "It runs about 28 May to 14 July. Traffic peaks from July to 15 August. June and September are quieter.",
        },
        {
          icon: "pin",
          title: "Book Reine, Moskenes and Å cabins early",
          text: "They fill first in July and August.",
        },
        {
          icon: "walk",
          title: "Allow a day each way for travel",
          text: "Four nights is short. Keep one slack day for weather.",
        },
        {
          icon: "food",
          title: "Visit the Å fish museum for stockfish",
          text: "The fish dry for about three months from Christmas, then come indoors. The fishing village museum in Å shows the craft; hours vary, so check museumnord.no.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport dates",
          text: "UK passports need no visa for **90 days** in any 180. The passport must be under **10 years** old on arrival and valid for **3 months** after you leave.",
          link: { label: "UK entry rules for Norway", href: "https://www.gov.uk/foreign-travel-advice/norway/entry-requirements" },
        },
        {
          icon: "passport",
          title: "Allow extra time at the border",
          text: "The EU's new Entry/Exit System (EES) takes your fingerprints and photo on your first entry. Queues are longer that day.",
          link: { label: "Read the UK guide to the Entry/Exit System", href: "https://www.gov.uk/guidance/eu-entryexit-system" },
        },
        {
          icon: "passport",
          title: "Check the EU travel authorisation before you book",
          text: "The European Travel Information and Authorisation System (ETIAS) is not running yet and has no confirmed start date.",
          link: { label: "Check the official EU travel site", href: "https://travel-europe.europa.eu" },
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly on to Leknes or Svolvær from Bodø",
          text: "Widerøe flies several times a day. In summer it also flies direct from Oslo and Bergen; check which airport at wideroe.no.",
        },
        {
          icon: "boat",
          title: "Take the Bodø to Moskenes ferry",
          text: "It takes about **3h 15**. Reserve a car by **20:00** the day before: only part of each sailing can be reserved. Be in the reserved queue **45 min** before sailing. Foot passengers travel free without a reservation.",
          link: { label: "Torghatten ferry prices", href: "https://www.torghatten.no/en/our-routes/18-782?tab=price" },
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Budget for the ferry with a car",
          text: "A car under 6 m is **605 kroner**, plus **130 kroner** to reserve. A reserved seat on foot is **65 kroner**.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire a car for the islands",
          text: "Reine to Henningsvær is about **2h**. The E10 runs the length of the islands.",
        },
        {
          icon: "car",
          title: "Plan around the Nappstraumen tunnel",
          text: "It closes at night for work in 2026.",
          temporary: "Until the 2026 night works end",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Reine",
          tips: [
            {
              title: "Climb Reinebringen, but stop at the platform",
              text: "It is about **450 m** high with **1,500** steps, and takes **2 to 3h** return. Avoid wet or foggy days. The ridge beyond the platform is unmarked and exposed, with several rescues a year. There is no water on the route.",
            },
            {
              title: "Park at Reine Ytre Havn",
              text: "Roadside parking near the trail is closed. Walk about **15 min** from the paid car park. Overnight vans are not allowed at the trailhead.",
            },
          ],
        },
        {
          place: "Henningsvær",
          tips: [
            {
              title: "Respect the football pitch",
              text: "It is a municipal field used for training and events. Do not interrupt play, respect closed gates, and do not fly drones over it.",
            },
            {
              title: "Drive out for surf and the midnight sun",
              text: "Unstad Arctic Surf hires boards and wetsuits and runs lessons. Henningsvær has no surf beach. For the midnight sun, use Uttakleiv or Laukvika, because Svolvær and Leknes are shaded by mountains.",
            },
          ],
        },
      ],
    },
  ],
};
