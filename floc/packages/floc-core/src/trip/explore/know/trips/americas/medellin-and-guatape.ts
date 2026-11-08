import type { TripKnow } from "../../know-types";

export const MEDELLIN_AND_GUATAPE: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Colombia", slug: "colombia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go in December to March, July or August",
          text: "These are the drier months. December is the dearest.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Carry an onward or return ticket",
          text: "UK passports need no visa for up to **90 days**. You may be asked to show a ticket out within 90 days. The UK government recommends **6 months** of passport validity.",
        },
        {
          icon: "passport",
          title: "Fill in the optional Check-Mig form",
          text: "It is an online arrival form, open from **72 hours** to **1 hour** before you land. It can speed up entry.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Take the airport bus or an authorised taxi",
          text: "The airport is at Rionegro, **35 to 45 min** from the city. The bus costs about **20,000 Colombian pesos**. A taxi was **132,000** under the January 2026 tariff.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Use cash machines inside a bank or mall",
          text: "Use them by day. The UK government advises against street machines.",
        },
        {
          icon: "ticket",
          title: "Pay at the booth for El Peñol",
          text: "The price is about **30,000 to 35,000 Colombian pesos**. Check at the booth.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Take the bus from Terminal del Norte",
          text: "It takes about **2h** and costs about **22,000 Colombian pesos**, with several a day from about **06:00**. Metro line A reaches Caribe station, which links to the terminal by a footbridge.",
        },
        {
          icon: "car",
          title: "Use a licensed taxi or your hotel's",
          text: "Book by phone or app. Do not hail taxis in the street.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Medellín",
          tips: [
            {
              title: "Visit Comuna 13 by day",
              text: "Keep to the main paths. A local guide adds context.",
            },
          ],
        },
        {
          place: "Guatapé",
          tips: [
            {
              title: "Climb El Peñol when it opens",
              text: "It opens at **08:00** and closes at **18:00**. The **740 steps** take about **30 min**, and the town sits at **1,925 m**, so go slowly. Weekends and holidays are busier.",
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
          title: "Guard your drink and avoid strangers' homes",
          text: "The UK government warns of drugging with scopolamine and of robbery through dating apps. Do not go to a stranger's home.",
        },
        {
          icon: "drop",
          title: "Drink bottled water, skip ice, use repellent",
          text: "Skip the ice. Zika and dengue are risks, so use repellent.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Do not drink alcohol in public",
          text: "It is illegal.",
        },
        {
          icon: "shield",
          title: "Allow extra time on protest days",
          text: "Protests can block roads.",
        },
      ],
    },
  ],
};
