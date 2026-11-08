import type { TripKnow } from "../../know-types";

export const HOI_AN_AND_HUE: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Vietnam", slug: "vietnam" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go from February to April",
          text: "This is dry and mild, with March and April best. May is hotter, with highs of **33 to 34°C** from May to August.",
        },
        {
          icon: "weather",
          title: "Avoid October to December",
          text: "Hoi An and Hue flood then, peaking from mid-October to late November. Roads and trains can stop for a day or more, so add **2 to 3** spare days if you must go.",
        },
        {
          icon: "moon",
          title: "Time your visit for a lantern night",
          text: "They fall on the 14th lunar day, which is 23 November and 23 December 2026. Check the date with your hotel. Boat rides can stop if the river floods.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Bring your passport, not a visa",
          text: "UK passports get **45 days** visa-free. Your passport needs **6 months** left and **2** blank pages.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly to Da Nang",
          text: "The airport is **30 km** from Hoi An, **35 to 50 minutes**. Use the Grab pick-up area and check the fare in the app before you go outside.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry dong in small notes",
          text: "Markets and street food take cash. Cards work in hotels and bigger shops.",
        },
        {
          icon: "ticket",
          title: "Buy the old town ticket in town",
          text: "Some areas need one. Buy it at the ticket booths and carry it.",
        },
        {
          icon: "ticket",
          title: "Bring cash for Hue tickets",
          text: "The combo for the Imperial City, Tu Duc and Khai Dinh is about **420,000 dong** for two days. Tickets are often cash only and prices can change, so check on the day.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Allow 3 hours by car between Hue and Hoi An",
          text: "The drive takes **2h 30 to 3h 30**. The pass road adds about **30 minutes** over the tunnel, and the pass has closed after landslides.",
        },
        {
          icon: "train",
          title: "Keep a bus or car backup for the coastal train",
          text: "Rockslides can close the railway over the pass for days.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Hội An",
          tips: [
            {
              title: "Get quotes from three tailors",
              text: "Ask for several fittings. Same-day tailoring is a red flag.",
            },
            {
              title: "Expect dark streets on lantern nights",
              text: "The old town switches off electric lights and keeps motorbikes out, roughly **18:00 to 21:00**.",
            },
          ],
        },
        {
          place: "Huế",
          tips: [
            {
              title: "Cover up at the tombs and pagodas",
              text: "Shoulders and knees must be covered.",
            },
            {
              title: "Start the day with bun bo Hue",
              text: "It is a spicy beef noodle soup and the usual Hue breakfast.",
            },
          ],
        },
      ],
    },
    {
      stage: "Staying well",
      tips: [
        {
          icon: "sun",
          title: "Go out early or late",
          text: "May to August feels hotter than the **33 to 34°C** highs.",
        },
        {
          icon: "weather",
          title: "Check storm warnings",
          text: "Typhoon season runs June to November.",
        },
      ],
    },
  ],
};
