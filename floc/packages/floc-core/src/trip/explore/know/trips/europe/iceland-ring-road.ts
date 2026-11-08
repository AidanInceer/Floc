import type { TripKnow } from "../../know-types";

export const ICELAND_RING_ROAD: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Iceland", slug: "iceland" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go between June and August",
          text: "The midnight sun runs in June and July, and highland roads open only in summer.",
        },
        {
          icon: "pin",
          title: "Book beds between Selfoss and Höfn early",
          text: "The east has few rooms, and summer fills them.",
        },
        {
          icon: "ticket",
          title: "Book glacier walks and the Mývatn baths ahead",
          text: "Both fill in summer.",
        },
        {
          icon: "health",
          title: "Bring a head net for Mývatn",
          text: "The name means lake of midges.",
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
          link: { label: "UK entry rules for Iceland", href: "https://www.gov.uk/foreign-travel-advice/iceland/entry-requirements" },
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
        {
          icon: "car",
          title: "Pack your driving licence",
          text: "A UK photocard licence is valid for up to **30 days**. A paper licence may need a 1968 International Driving Permit too.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Collect your hire car at Keflavík airport",
          text: "The Ring Road is **1,309 km**. Route 1 is paved all the way.",
        },
        {
          icon: "shield",
          title: "Check for eruption news on the Reykjanes peninsula",
          text: "Eruptions have happened near the airport. Read the UK government's advice before you go.",
          link: { label: "UK safety advice for Iceland", href: "https://www.gov.uk/foreign-travel-advice/iceland/safety-and-security" },
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Pay by card, and buy picnics",
          text: "Cash is rarely needed. Food is dear: buy picnics.",
        },
        {
          icon: "ticket",
          title: "Pay for parking at Skaftafell and Jökulsárlón",
          text: "It is **1,110 krónur** a car a day, and half price if you used another Vatnajökull park site that day.",
        },
        {
          icon: "ticket",
          title: "Pay the Vaðlaheiði tunnel toll online",
          text: "It is **2,216 krónur** a car near Akureyri. Pay within **24 hours** before or after. Ask your hire firm how it handles this.",
          link: { label: "Pay the toll", href: "https://www.veggjald.is/verd-greidsluleidir" },
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Drive anticlockwise and plan at least 7 days",
          text: "Route 1 needs no four-wheel drive. Limits are **90 km/h** on open road, **70** in tunnels and **50** in towns.",
        },
        {
          icon: "car",
          title: "Keep your headlights on all day",
          text: "This is the law all year. Fines can reach **£500**, and the drink-drive limit is lower than in the UK.",
        },
        {
          icon: "car",
          title: "Give way on one-lane bridges",
          text: "The driver who arrives first has priority.",
        },
        {
          icon: "weather",
          title: "Check road conditions each morning",
          text: "Use umferdin.is and safetravel.is. Passes such as Hellisheiði and Holtavörðuheiði can close in bad weather.",
          link: { label: "Check roads and weather", href: "https://safetravel.is/" },
        },
        {
          icon: "fuel",
          title: "Fill up early in the east",
          text: "Services are thin. The longest gap between fast chargers is **113 km**, from Mývatn to Skjöldólfsstaðir.",
        },
        {
          icon: "weather",
          title: "Park nose into the wind",
          text: "Wind can blow sand or ash onto a hire car, and paint damage may not be covered.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Reykjavík",
          tips: [
            {
              title: "Keep the first day short",
              text: "The Golden Circle loop is about **300 km**, which is long after a flight. Pick a short lunch and sleep early.",
            },
          ],
        },
        {
          place: "Vík",
          tips: [
            {
              title: "Watch the warning light at Reynisfjara",
              text: "Waves have killed visitors, most recently in August 2025 under a yellow light. Orange means stay **25 m** from the sea. Red means the beach is shut. Never turn your back to the sea.",
            },
            {
              title: "Skip the path behind Seljalandsfoss when it ices",
              text: "It is shut roughly from November to March.",
            },
          ],
        },
        {
          place: "Höfn",
          tips: [
            {
              title: "Do Skaftafell on the drive east",
              text: "Do the **5.8 km** Svartifoss loop (about **2h**) or a glacier walk, not both. Doing it from Höfn means about **3h** of driving back and forth.",
            },
            {
              title: "Spend the next day at Stokksnes",
              text: "See Vestrahorn, then keep the afternoon free.",
            },
          ],
        },
        {
          place: "Seyðisfjörður",
          tips: [
            {
              title: "Allow 4h from Höfn",
              text: "That is about **246 km** to Egilsstaðir, then **25 min** over the pass.",
            },
          ],
        },
        {
          place: "Mývatn",
          tips: [
            {
              title: "Allow about 3h from Seyðisfjörður",
              text: "The long plateau on Route 1 slows you down.",
            },
            {
              title: "Take the paved west road to Dettifoss",
              text: "Use road 862. The gravel road 864 shuts from the first autumn snow. The park calls Dettifoss the most powerful waterfall in Europe.",
            },
          ],
        },
        {
          place: "Akureyri",
          tips: [
            {
              title: "Sail from Akureyri to see whales",
              text: "Several operators leave from the centre, so a detour to Húsavík is not needed.",
            },
          ],
        },
        {
          place: "Snæfellsnes",
          tips: [
            {
              title: "Allow 5h to 5h 30 from Akureyri",
              text: "See Kirkjufell first, then Arnarstapi.",
            },
            {
              title: "Leave at 07:00 for a 14:00 flight",
              text: "The drive to Keflavík is about **3h**. Or book a flight after **16:00**.",
            },
          ],
        },
      ],
    },
    {
      stage: "Staying well",
      tips: [
        {
          icon: "shield",
          title: "Call 112, and use the SafeTravel app",
          text: "It shows weather and roads, and can send your position to emergency services. Leave a travel plan on safetravel.is.",
          link: { label: "Leave a travel plan", href: "https://safetravel.is/" },
        },
      ],
    },
  ],
};
