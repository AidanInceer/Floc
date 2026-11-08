import type { TripKnow } from "../../know-types";

export const FIJI_CORAL_COAST: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Fiji", slug: "fiji" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Travel from May to October",
          text: "This is the dry season. Cyclone season runs November to April.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport and onward ticket",
          text: "The passport must be valid **6 months** past arrival. You need an onward ticket. No visa is needed for up to **4 months**.",
        },
        {
          icon: "shield",
          title: "Buy insurance with evacuation",
          text: "Hospitals ask for cash first, and the UK has no health agreement with Fiji.",
        },
        {
          icon: "customs",
          title: "Declare cash of 10,000 Fiji dollars or more",
          text: "The limit is **10,000 Fiji dollars**.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Connect on the way from the UK",
          text: "No direct UK flights run to Nadi. Connect through Singapore, Hong Kong or Los Angeles; check the routes. Sigatoka is about **55 minutes** by road from Nadi town.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry Fiji dollar cash for villages and islands",
          text: "Cash is the safest way to pay on the islands.",
        },
        {
          icon: "ticket",
          title: "Check your fare includes departure tax",
          text: "The departure tax is **200 Fiji dollars** since 1 August 2025. Ask your airline whether it is in the ticket.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Use yellow-plate taxis and minibuses",
          text: "Only these are licensed. Avoid road travel outside urban areas at night.",
        },
        {
          icon: "boat",
          title: "Plan the road before the boat",
          text: "Mamanuca boats leave from Port Denarau, about **1 hour 15** by road from Sigatoka and about **1 hour** from Korotogo. The boat takes **30 minutes** to **1 hour 45** depending on the island.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Coral Coast",
          tips: [
            {
              title: "Walk the Sigatoka sand dunes early",
              text: "They open **08:00 to 16:30** and close **13:00 to 14:00**. Entry is **10 Fiji dollars**.",
              link: { label: "See the Sigatoka Sand Dunes", href: "https://nationaltrust.org.fj/ssd/" },
            },
            {
              title: "Swim only where it is safe",
              text: "Rip tides run at reef gaps and river mouths. Swim at lifeguarded beaches or follow local advice.",
            },
          ],
        },
        {
          place: "Mamanuca islands",
          tips: [
            {
              title: "Treat Cloud 9 as a floating bar",
              text: "The boat leaves Port Denarau at about **09:00** and returns about **15:00**. A **13:00** sailing needs 25 guests. Check what the price includes before you book.",
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
          title: "Use repellent against mosquitoes",
          text: "Mosquitoes in Fiji can spread dengue, Zika and chikungunya. Large amounts of kava can harm the liver.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Cover shoulders and knees in villages",
          text: "Take hats off and ask before photos. Give kava root to the chief if you visit. Say \"bula\" for hello.",
        },
        {
          icon: "shield",
          title: "Keep clothes on in public",
          text: "Topless bathing and nudity in public are illegal.",
        },
      ],
    },
  ],
};
