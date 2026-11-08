import type { TripKnow } from "../../know-types";

export const FARO_TO_TAVIRA_BY_TRAIN: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Portugal", slug: "portugal" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go in May, June, September or October",
          text: "These months suit the hot, dry Algarve climate and are quieter.",
        },
        {
          icon: "pin",
          title: "Book rooms near the ferry early",
          text: "They fill in July and August.",
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
          link: { label: "UK entry rules for Portugal", href: "https://www.gov.uk/foreign-travel-advice/portugal/entry-requirements" },
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
          title: "Take a bus or taxi from Faro airport",
          text: "The airport is close to town. Trains for Tavira leave from Faro station.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry coins for ferries and beach bars",
          text: "The euro is used. Cards work in most places.",
        },
        {
          icon: "food",
          title: "Refuse bread and olives you did not order",
          text: "They are put on the table and charged. You can refuse them.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Take the regional train to Tavira",
          text: "It takes about **35 min** and runs often. Buy at the station or in the railway's app, and check times on cp.pt.",
        },
        {
          icon: "boat",
          title: "Take the ferry from Quatro Águas",
          text: "It is a short taxi ride or walk from the centre. In winter only this route runs, with few boats.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Faro",
          tips: [
            {
              title: "See the bone chapel behind the Carmo church",
              text: "The Capela dos Ossos is lined with skulls. Check the opening hours and ticket on the day.",
            },
          ],
        },
        {
          place: "Tavira",
          tips: [
            {
              title: "Plan your way back before the last boat",
              text: "The island has two beach sides: the ferry side and the Barril side, with the old anchors. Barril is reached by footbridge, then a small summer train or a **2 km** walk. Check the last return before you cross.",
            },
            {
              title: "Bring a towel",
              text: "Beach bars charge for sunbeds. The sand is free.",
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
          title: "Cover up on the island",
          text: "The Algarve sun burns fast and there is little shade.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "food",
          title: "Order a cataplana, and say \"bom dia\"",
          text: "It is clam stew cooked in a copper pan. Say \"bom dia\" for good morning.",
        },
      ],
    },
  ],
};
