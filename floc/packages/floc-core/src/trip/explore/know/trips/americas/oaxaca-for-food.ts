import type { TripKnow } from "../../know-types";

export const OAXACA_FOR_FOOD: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Mexico", slug: "mexico" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Book a cooking class ahead",
          text: "Popular ones fill. Casa Crespo, Seasons of My Heart and Alma de mi Tierra are among them.",
        },
        {
          icon: "ticket",
          title: "Book months ahead for big festivals",
          text: "Day of the Dead runs from **31 October to 2 November**, and the Night of the Radishes is on **23 December**. Both are busy and dear.",
        },
        {
          icon: "food",
          title: "Plan food days round the markets",
          text: "Saturday is Mercado de Abastos, one of Mexico's biggest. Sunday is Tlacolula market.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your stamp for the stay length",
          text: "UK passports need no visa for tourists. The immigration stamp gives your allowed stay.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly via Mexico City",
          text: "The airport mostly serves Mexico City. The bus from Mexico City takes about **6h 30**.",
        },
        {
          icon: "car",
          title: "Choose your airport transfer",
          text: "A shared van costs **135 pesos**, a fixed-price taxi **350** and a private taxi **490** (February 2026). Book the shared van the day before.",
        },
        {
          icon: "shield",
          title: "Leave extra time for your flight home",
          text: "Protests have blocked vehicle access to Oaxaca airport.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry pesos in cash",
          text: "Markets, tlayuda stalls and shared vans are cash only. Tlayudas are sold outside Mercado 20 de Noviembre.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Use a taxi app or a yellow city cab",
          text: "You get a fixed price in a yellow city cab. Agree the fare first for any other taxi.",
        },
        {
          icon: "pin",
          title: "Check Hierve el Agua is open",
          text: "The site has been shut for long spells over land disputes. Go via Mitla, and carry cash for each gate: about **50 to 100 pesos** in total.",
        },
        {
          icon: "food",
          title: "Drive to Santiago Matatlán for mezcal",
          text: "It is about **50 km** and **1 hour** away.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Oaxaca",
          tips: [
            {
              title: "Carry little to Abastos on Saturday",
              text: "It is large and busy, with pickpockets.",
            },
            {
              title: "Visit Monte Albán early",
              text: "It opens **08:00 to 17:00** and costs **210 pesos** (February 2026). It is **25 to 35 min** away; vans cost **120 to 130 pesos** return.",
            },
          ],
        },
      ],
    },
    {
      stage: "Staying well",
      tips: [
        {
          icon: "drop",
          title: "Drink bottled or boiled water",
          text: "Avoid ice. The UK government lists dengue and Zika.",
        },
        {
          icon: "shield",
          title: "Find your hotel exit when you arrive",
          text: "Tremors happen regularly in Oaxaca.",
        },
        {
          icon: "health",
          title: "Expect to pay first at some hospitals",
          text: "Some do not bill insurers directly. You pay, then claim later.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Ask for dishes by name",
          text: "Say tlayuda, mole negro or memelas. Greet with buenos días first.",
        },
      ],
    },
  ],
};
