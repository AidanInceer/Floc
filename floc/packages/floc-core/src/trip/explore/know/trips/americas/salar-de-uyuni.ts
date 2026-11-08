import type { TripKnow } from "../../know-types";

export const SALAR_DE_UYUNI: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Bolivia", slug: "bolivia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "car",
          title: "Plan for three days, then back in Uyuni",
          text: "The standard tour is back in Uyuni at about **18:00** on day 3. A one-way transfer on to San Pedro de Atacama is a separate product, from about **US$169**.",
        },
        {
          icon: "ticket",
          title: "Pick a licensed four-wheel-drive firm",
          text: "Choose one with recent reviews, not the cheapest. Ask for a written itinerary and the group size. Seats are often shared, so ask for a private car if you want one.",
        },
        {
          icon: "ticket",
          title: "Book ahead for June to September",
          text: "The deposit is paid online and the balance in cash on the day.",
        },
        {
          icon: "weather",
          title: "Choose the dry white flat or the mirror",
          text: "May to November is the dry white flat. January to March gives the mirror effect, but the rains run January to April and routes change. Incahuasi may be skipped if flooded.",
        },
        {
          icon: "sun",
          title: "Expect sunset on the flat, not sunrise",
          text: "The tour crosses the flat on day 1 and watches sunset there. Dawn on day 3 is at the Sol de Mañana geysers.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport has 6 months left",
          text: "UK passports need no visa for up to **90 days** in a year, but officers often stamp **30**. The passport needs **2 blank pages**. You may be asked for a first-night booking. Get an entry stamp, or you pay a fine when you leave.",
        },
        {
          icon: "shield",
          title: "Check the UK advice for roadblocks",
          text: "It was updated on 22 September 2026 with state-of-emergency information. Do not try to cross a roadblock. Bus tickets marked \"condicionado\" are not guaranteed to arrive.",
        },
        {
          icon: "health",
          title: "Ask a doctor about altitude tablets",
          text: "Ask about acetazolamide. Some medicines are short in Bolivia, so bring all you need and insurance that covers evacuation.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Spend a night in La Paz or Sucre first",
          text: "Uyuni is at about **3,650 m**. A flight from La Paz takes about **1 hour**; the overnight bus takes about **10 hours** and arrives near dawn.",
        },
        {
          icon: "pin",
          title: "Arrive in Uyuni the day before the tour",
          text: "Tours leave in the morning, so do not arrive on the same day.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry cash for park fees",
          text: "Fees are not in the tour price and are usually paid in cash: about **210 bolivianos** in all. Polques hot springs may cost less.",
        },
        {
          icon: "money",
          title: "Bring 350 to 500 bolivianos for extras",
          text: "Toilets cost about **6 bolivianos** each, and rubber boots to hire about **30**.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Follow the three-day route",
          text: "The tour sleeps one night near the salt flat and one at the Laguna Colorada refuge. Day 1 is the train cemetery, Colchani, Incahuasi and sunset, with a night at Colcha K. Day 2 crosses lagoons and the Siloli desert to Laguna Colorada. Day 3 is geysers, Polques and back to Uyuni.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Uyuni",
          tips: [
            {
              title: "Meet your driver at about 10:15",
              text: "Tours leave daily. The salt flat is crossed on day 1.",
            },
          ],
        },
        {
          place: "Salt hotel",
          tips: [
            {
              title: "Ask which night stay your tour uses",
              text: "The tour checked uses a refuge in Colcha K with a shared bathroom. Some tours use a salt-block hotel instead. Hot water varies by night.",
            },
          ],
        },
        {
          place: "Laguna Colorada",
          tips: [
            {
              title: "Pack a warm sleeping bag for the refuge",
              text: "Winter nights from June to September can reach **-20°C**. The refuge shower is cold.",
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
          title: "Take it slowly above 4,000 m",
          text: "Most of the tour is above **4,000 m**, up to nearly **5,000 m**. The UK government names the Salar for altitude sickness.",
        },
        {
          icon: "sun",
          title: "Wear glasses with side shields",
          text: "The sun burns fast at this height, and the salt glares.",
        },
        {
          icon: "weather",
          title: "Pack for a wide temperature range",
          text: "Winter runs **-20°C to 16°C**. Summer runs **4°C to 23°C**.",
        },
      ],
    },
  ],
};
