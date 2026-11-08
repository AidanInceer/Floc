import type { TripKnow } from "../../know-types";

export const ACCRA_AND_CAPE_COAST: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Ghana", slug: "ghana" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "shield",
          title: "Read the regional warnings first",
          text: "The UK government advises against all but essential travel to parts of Ghana. Check its regional page before you plan.",
          link: { label: "UK travel advice for Ghana", href: "https://www.gov.uk/foreign-travel-advice/ghana" },
        },
        {
          icon: "weather",
          title: "Go between December and March",
          text: "These are the driest months on the coast. The main rains fall from April to June.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Apply for your visa early",
          text: "UK passports need a visa. An official online visa site has run since 25 May 2026, with a single-entry fee of about **US$260**. Check the site for the price.",
          link: { label: "Apply for the Ghana visa", href: "https://evisa.immigration.gov.gh" },
        },
        {
          icon: "passport",
          title: "Allow time if you apply by post",
          text: "The post route through the High Commission takes **10 to 15 days**.",
        },
        {
          icon: "health",
          title: "Carry a yellow fever certificate",
          text: "It is required. Also complete the online Ghana Health Declaration before you fly.",
        },
        {
          icon: "passport",
          title: "Check your passport has 6 months left",
          text: "It must be valid for **6 months** after you arrive.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Confirm your driver by name",
          text: "Impostors have posed as airport drivers. Use licensed taxis and check the driver's identity.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Bring a Visa card and cash",
          text: "Mastercard is not widely accepted. Carry cash as a back-up.",
        },
        {
          icon: "customs",
          title: "Declare large amounts of cash",
          text: "Cash of **US$10,000** or more can be taken from you if you do not declare it.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Leave Accra before 07:00",
          text: "Allow **3h to 3h 30** to Cape Coast. Jams on the Kasoa road add time. Coaches and private cars both run.",
        },
        {
          icon: "moon",
          title: "Do not drive outside towns after dark",
          text: "Roads are poor and badly lit.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Accra",
          tips: [
            {
              title: "Ask before you climb Jamestown lighthouse",
              text: "A caretaker may hold the key and charge a small fee. Ask at the door.",
            },
          ],
        },
        {
          place: "Cape Coast",
          tips: [
            {
              title: "Ask about evening castle tours",
              text: "Both castles were announced open until **22:00** in August 2026. Ask for the hours and fee on the day.",
            },
            {
              title: "Book the Kakum canopy walk at the visitor centre",
              text: "Walks are guided. Park entry and the canopy walk are charged separately, so ask for current prices and hours.",
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
          title: "See a travel clinic 8 weeks ahead",
          text: "Malaria, yellow fever and dengue are risks. Care is poor outside towns, so insure for evacuation.",
        },
        {
          icon: "drop",
          title: "Stay out of the sea at southern beaches",
          text: "Rip tides and undertows have caused deaths. Do not go to beaches alone: theft is the main risk.",
        },
        {
          icon: "shield",
          title: "Avoid walking alone after dark",
          text: "Bag snatching is rising in Accra.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Dress modestly and skip camouflage",
          text: "Camouflage clothing is banned. Ask before you photograph guards, airports or military sites.",
        },
      ],
    },
  ],
};
