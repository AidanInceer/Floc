import type { TripKnow } from "../../know-types";

export const VICTORIA_FALLS_BOTH_SIDES: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Zambia", slug: "zambia" },
    { country: "Zimbabwe", slug: "zimbabwe" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go from late August to October",
          text: "Devil's Pool is open and the falls are still strong. They are thinnest in November and December and heaviest from April to June.",
        },
        {
          icon: "ticket",
          title: "Book Devil's Pool before you fly",
          text: "It sells out in the open months and is open about mid-August to late December, to mid-January with some operators. It depends on the river, and early or late dates can close.",
        },
        {
          icon: "drop",
          title: "Swim only if you are a confident swimmer",
          text: "Devil's Pool is on the Zambian side, at the lip of the falls. The usual minimum age is **12**, and tours cost about **US$125 to US$205**.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Buy the joint Univisa",
          text: "UK passports need a Zimbabwe visa. The Univisa costs **US$50**, lasts **30 days** and covers both countries. Buy it at the bridge border or at either airport.",
        },
        {
          icon: "passport",
          title: "Show a return ticket for Zambia",
          text: "Zambia needs no visa for up to **90 days**, but wants a return or onward ticket and enough money.",
        },
        {
          icon: "passport",
          title: "Check your passport",
          text: "It needs **6 months** left. Zambia asks for **2** blank pages and Zimbabwe for **3**.",
        },
        {
          icon: "health",
          title: "Ask a clinic about malaria 8 weeks ahead",
          text: "The Zambezi valley, including Livingstone and Victoria Falls, is a malaria area. Take malaria advice for any month.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Pick the airport on your first night's side",
          text: "Livingstone and Victoria Falls airports are both close to town.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Take small, clean US dollar notes",
          text: "Zimbabwe uses US dollars. Cards often fail, change is hard to find and torn notes are refused. Zambia uses its own currency, the kwacha.",
        },
        {
          icon: "ticket",
          title: "Budget for the rainforest walk",
          text: "Entry on the Zimbabwe side is **US$58** for international visitors since 2026. On the Zambian side ask at the gate: published rates differ.",
        },
        {
          icon: "money",
          title: "Use licensed money changers only",
          text: "Exchanging money outside licensed dealers is illegal in Zimbabwe.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Allow about 1 hour to cross the bridge",
          text: "That is about **30 min** for the formalities plus the short drive. The border post has run 24 hours since 13 November 2025. You can also walk the bridge.",
        },
        {
          icon: "moon",
          title: "Drive in daylight only",
          text: "Do not wander at night. Use taxis or a pre-arranged transfer.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Livingstone",
          tips: [
            {
              title: "Stay here for Devil's Pool",
              text: "If you sleep in Zimbabwe first, you cross the border twice.",
            },
          ],
        },
        {
          place: "Victoria Falls town",
          tips: [
            {
              title: "Walk the rainforest path",
              text: "Bring a waterproof for your phone in the high months, when the mist is heavy.",
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
          title: "Keep away from hippos and crocodiles",
          text: "Wild animals kill. Do not swim in the river outside a licensed trip.",
        },
        {
          icon: "shield",
          title: "Check the safety record of adventure sports",
          text: "The UK government notes serious accidents on both sides.",
        },
        {
          icon: "lock",
          title: "Carry a power bank",
          text: "Power cuts are frequent in Zimbabwe.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Do not photograph police or army sites",
          text: "The UK government advises against it in Zimbabwe.",
        },
      ],
    },
  ],
};
