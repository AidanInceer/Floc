import type { TripKnow } from "../../know-types";

export const STONE_TOWN_AND_PAJE: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Tanzania", slug: "tanzania" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go between June and October",
          text: "These are the dry months. Many places close in the long rains from March to May.",
        },
        {
          icon: "moon",
          title: "Plan around Ramadan in early 2027",
          text: "It is expected from about **8 February**. Stone Town eateries change hours, and you should not eat or drink in public by day.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get an online visa",
          text: "UK passports need a visa. The same one covers Zanzibar. A single-entry visa on arrival also exists.",
        },
        {
          icon: "passport",
          title: "Buy the government inbound insurance",
          text: "It costs **US$44** for an adult and is valid up to **92 days**, from 1 October 2026. Your own policy does not replace it, and entry can be refused without it. One policy covers mainland and Zanzibar.",
          link: { label: "Buy the Zanzibar insurance", href: "https://inbound.visitzanzibar.go.tz" },
        },
        {
          icon: "passport",
          title: "Check your passport",
          text: "It needs **6 months** left and **1** blank page.",
        },
        {
          icon: "health",
          title: "Carry a yellow fever certificate if needed",
          text: "It is required if you arrive from a risk country. Kenya and Uganda are on the list.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly to Zanzibar, 5 km from Stone Town",
          text: "A fast ferry from Dar es Salaam takes about **1h to 1h 20**. Buy tickets yourself: touts at the Dar terminal sell inflated fares.",
        },
        {
          icon: "car",
          title: "Agree the taxi price to Paje first",
          text: "The ride is about **1h**. A shared shuttle costs less: book ahead.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Bring cash",
          text: "Cards fail outside big hotels. Newer US dollar notes get better rates. Withdraw cash in Stone Town before you go east.",
        },
        {
          icon: "money",
          title: "Carry shillings for markets and dala-dalas",
          text: "Dala-dalas (shared minibuses) are cheap and slow.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Stone Town",
          tips: [
            {
              title: "Walk away from touts at Forodhani",
              text: "Touts called papasi push tours. Prison Island's fee rose in 2025 and it is poor value.",
            },
          ],
        },
        {
          place: "Paje",
          tips: [
            {
              title: "Check the tide table before you swim",
              text: "At low tide the sea can be almost **1 km** out. Seaweed farms sit in the shallows.",
            },
            {
              title: "Book the Mnemba boat from the north",
              text: "Mnemba trips leave from Matemwe, Nungwi and Kendwa, not Paje. Ask the operator for the transfer time.",
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
          title: "Use hotel-arranged taxis",
          text: "Bags are snatched in Stone Town and on beaches. Do not walk empty beaches alone at night.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Cover shoulders and knees",
          text: "Fines of **US$700** or more are possible outside resorts. The island is mostly Muslim, and alcohol is sold in hotels and some bars only.",
        },
        {
          icon: "customs",
          title: "Skip public affection",
          text: "Same-sex acts are illegal. No kissing or hand-holding in public.",
        },
      ],
    },
  ],
};
