import type { TripKnow } from "../../know-types";

export const SLOVENIA_LAKE_AND_CAVES: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Slovenia", slug: "slovenia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Book a Vintgar Gorge pass online",
          text: "It is open April to October only, tickets are limited, and it is busiest from **10:00 to 13:00**. Entry is **€15**.",
        },
        {
          icon: "ticket",
          title: "Check the Škocjan tour times for your day",
          text: "Tours are timed and guided, in Slovene and English. There are fewer in winter. The site is shut on 25 December and 1 January.",
        },
        {
          icon: "weather",
          title: "Go from May to September",
          text: "The Bled swimming area is open mid-June to September. Bled is busiest on summer weekends.",
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
          link: { label: "UK entry rules for Slovenia", href: "https://www.gov.uk/foreign-travel-advice/slovenia/entry-requirements" },
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
          icon: "passport",
          title: "Register with the police within 3 days",
          text: "Hotels and guest houses usually do it for you.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly into Ljubljana",
          text: "Trieste is an option for an open-jaw trip, about an hour from Ljubljana.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Use the euro and round up",
          text: "Tipping is not expected. Cash machines are fewer in small towns, and one bank charges **€6** a withdrawal.",
        },
        {
          icon: "ticket",
          title: "Budget for the main sights",
          text: "Škocjan runs from **€16** to **€24** by month. Bled castle is **€19**.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire a car for Škocjan",
          text: "Buses are thin on Saturdays and very limited on Sundays.",
        },
        {
          icon: "ticket",
          title: "Buy an e-vignette before you drive",
          text: "It is **€16** for a week in 2026. The plate and country are checked, and a wrong plate counts as unpaid.",
          link: { label: "Buy the e-vignette", href: "https://evinjeta.dars.si/en" },
        },
        {
          icon: "car",
          title: "Plan a long Bled to Piran day",
          text: "Allow **5 to 6 hours** in all. The drive alone is about **2h**. The Škocjan tour takes **2.5 to 3h**. Leave Bled by **08:00**.",
        },
        {
          icon: "train",
          title: "Take the bus from Ljubljana to Bled",
          text: "It takes **75 min**, costs **€7** and runs hourly. The train stops at Lesce-Bled, **4 km** out. By car it is about **1h**.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Bled",
          tips: [
            {
              title: "Take a pletna boat to the island",
              text: "A boatman rows it. It costs **€20** each return in cash and takes about **90 min**. The island church is about **€3**.",
            },
            {
              title: "Park free at Vintgar Lip",
              text: "Cars cannot drive to the gorge. An electric bus runs from there for **€2.50**.",
            },
          ],
        },
        {
          place: "Piran",
          tips: [
            {
              title: "Park outside Piran's old town",
              text: "Old town parking is **€24** a day. Arze is about **€12** and Fornače about **€17**. A free shuttle runs to Tartini Square about every **15 min**.",
            },
            {
              title: "Check the wall hours before you climb",
              text: "The north section costs **€3** and is narrow and steep. Opening hours are not published.",
            },
          ],
        },
      ],
    },
    {
      stage: "Staying well",
      tips: [
        {
          icon: "health",
          title: "Wear a jacket in the Škocjan cave",
          text: "It is **12 °C** inside. Photography is not allowed. About **1,000** steps need shoes with grip.",
        },
        {
          icon: "health",
          title: "Use repellent against ticks",
          text: "They are common in grass and woods.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Say \"dober dan\", and try kremšnita at Bled",
          text: "Say dober dan to people on trails. Try kremšnita, a cream cake, at Bled.",
        },
        {
          icon: "food",
          title: "Eat on side streets",
          text: "Waterfront restaurants in Piran and Bled charge more.",
        },
      ],
    },
  ],
};
