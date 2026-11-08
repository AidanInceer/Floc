import type { TripKnow } from "../../know-types";

export const MARRAKECH_AND_TOUBKAL: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Morocco", slug: "morocco" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go between May and October",
          text: "Snow lies on the mountain until about April. Crampons are needed in February and March, and winter has avalanche risk.",
        },
        {
          icon: "walk",
          title: "Plan a summit day of 10 to 12 hours",
          text: "It is 2.5 to 4 hours up from the refuge, about 3 hours back to it, then **4 to 5 hours** down to Imlil, then **1h 30** by car. Plan nothing else that evening.",
        },
        {
          icon: "shield",
          title: "Hire a licensed guide through your operator",
          text: "The UK government advises a professional guide for hiking.",
        },
        {
          icon: "health",
          title: "Check your insurance names trekking to 4,000 m",
          text: "Cover must match your planned activity. Check the altitude limit on your policy.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport",
          text: "UK passports need no visa for up to **90 days**. The passport must be valid **3 months** after you arrive.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Book a transfer or taxi to Imlil",
          text: "Imlil is about **60 km** away. A shared taxi takes **75 to 90 min** and costs about **40 dirhams** a seat, but taxis can be scarce after **11:00**. From Asni a shared taxi to Imlil is about **15 dirhams**.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Draw dirhams in Marrakech before you go up",
          text: "Take small notes for tips and tea. Tip the guide and mule driver in cash at the end.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "walk",
          title: "Let mules carry the bags to the refuge",
          text: "Take only a day pack. Poles help on the loose stones.",
        },
        {
          icon: "walk",
          title: "Allow 6 to 7 hours to the refuge",
          text: "The walk from Imlil takes about **6 to 7 hours**. The refuge is at about **3,200 m**.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Imlil",
          tips: [
            {
              title: "Agree guide and mule prices first",
              text: "Touts and so-called free guides work Imlil.",
            },
            {
              title: "Walk up to Kasbah du Toubkal for tea",
              text: "It is a **15 minute** uphill walk.",
            },
          ],
        },
        {
          place: "Toubkal refuge",
          tips: [
            {
              title: "Take a headtorch and a warm layer",
              text: "Guides usually take the summit early on day two. Above **3,500 m** it can freeze even in summer.",
            },
          ],
        },
        {
          place: "Marrakech",
          tips: [
            {
              title: "Book Jardin Majorelle online first",
              text: "Tickets are sold online only. Check the hours and book online.",
              link: { label: "Book Jardin Majorelle", href: "https://jardinmajorelle.com/ang/visit/" },
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
          title: "Rest and drink water on night one",
          text: "Headache at the refuge is common. Go down if it becomes vomiting or loss of balance.",
        },
        {
          icon: "shield",
          title: "Expect earthquake damage in Imlil and Asni",
          text: "The 2023 earthquake destroyed or badly damaged both villages. Use a professional guide and insure your activity.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Greet people and ask before photos",
          text: "Say salam. Ask before you photograph people and cover knees in villages.",
        },
      ],
    },
  ],
};
