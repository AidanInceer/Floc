import type { TripKnow } from "../../know-types";

export const BYRON_AND_THE_HINTERLAND: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Australia", slug: "australia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Pick September to November or March to May",
          text: "December to March is hot, humid and wet, and the busiest and dearest time. The shoulder months avoid both.",
        },
        {
          icon: "ticket",
          title: "Book early for school holidays",
          text: "Stays, surf lessons and sunrise guided walks sell out in late December to January and at Easter.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Apply for the free eVisitor before you fly",
          text: "A UK passport can use the free eVisitor, or the electronic travel authorisation app, which may add a service fee. Apply before you fly.",
        },
        {
          icon: "shield",
          title: "Buy travel insurance",
          text: "The UK agreement covers urgent hospital care. Insure for the rest.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly to Ballina or the Gold Coast",
          text: "Ballina Byron Gateway has direct flights from Sydney and Melbourne and is about **30 minutes** from Byron. The Gold Coast is about **45 minutes** away. Shuttles take **40 to 60 minutes**.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Pay by card or phone",
          text: "Cards and phone pay work almost everywhere. Tipping is not expected.",
        },
        {
          icon: "money",
          title: "Self-cater some meals",
          text: "Byron is dear in school holidays.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire a car for the hinterland",
          text: "Byron town is walkable and bike-friendly. Parking in Byron is tight in summer.",
        },
        {
          icon: "car",
          title: "Drive on the left",
          text: "Tropical downpours can flood roads in summer.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Byron Bay",
          tips: [
            {
              title: "Walk up to the lighthouse from town",
              text: "Lighthouse parking is **A$10** an hour with a limit of **1 hour** a day. The lawn opens at **08:00**, and the cafe has been closed since 31 May 2026, so take water and breakfast.",
              link: { label: "See Cape Byron Lighthouse", href: "https://www.nationalparks.nsw.gov.au/things-to-do/historic-buildings-places/cape-byron-lighthouse" },
            },
            {
              title: "Go early or late to The Pass",
              text: "The Pass and Wategos fill up in summer. Parking at The Pass is **A$5** an hour.",
            },
          ],
        },
        {
          place: "Bangalow",
          tips: [
            {
              title: "Time your visit for the 4th Sunday market",
              text: "Bangalow Market runs on the 4th Sunday of each month only, **08:00 to 14:30**. The next is 22 November 2026.",
              link: { label: "See Bangalow Market", href: "https://www.bangalowmarket.com.au" },
            },
            {
              title: "Check park alerts before Minyon Falls",
              text: "The lookout is an easy walk, and a track leads to the base. Nobody may enter within **100 m** of the top, and the park may close.",
              link: { label: "See Minyon Falls lookout", href: "https://www.nationalparks.nsw.gov.au/things-to-do/lookouts/minyon-falls-lookout" },
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
          title: "Cover up against the sun",
          text: "The sun is extreme in summer. Wear a rash vest and a hat.",
        },
        {
          icon: "drop",
          title: "Swim between the flags",
          text: "Rip currents are the main risk on every beach. Do not dive in shallow water.",
        },
        {
          icon: "weather",
          title: "Watch for bushfire from November to February",
          text: "Fire risk is highest in those months. The track at Cape Byron can close in bad weather or fire danger.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Expect patchy signal in the rainforest",
          text: "Coverage is fine in town.",
        },
      ],
    },
  ],
};
