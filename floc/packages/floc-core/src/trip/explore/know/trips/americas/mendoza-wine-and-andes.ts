import type { TripKnow } from "../../know-types";

export const MENDOZA_WINE_AND_ANDES: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Argentina", slug: "argentina" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Book Uco wineries before you fly",
          text: "Zuccardi takes all visits by reservation. Book other Uco wineries ahead too.",
        },
        {
          icon: "weather",
          title: "Check the Aconcagua park dates",
          text: "In 2025 to 2026 the park season ran from **1 November to 30 April**, so October is outside it. The 2026 to 2027 dates are not out yet. In October expect only the roadside viewpoint and Puente del Inca. Snow can close Route 7 in winter.",
          temporary: "Until the 2026 to 2027 dates are published",
        },
        {
          icon: "food",
          title: "Plan one tasting and one lunch a day",
          text: "Do not try four tastings.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Stay up to 90 days without a visa",
          text: "UK passports need no visa for up to **90 days**.",
        },
        {
          icon: "car",
          title: "Buy an international driving permit to drive",
          text: "The UK government says to carry your UK licence and a 1949 international driving permit, bought in the UK.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly to Mendoza",
          text: "El Plumerillo airport is usually reached through Buenos Aires or Santiago.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Pay by card and choose pesos",
          text: "Cards work in most places. Pick pesos when the machine asks. You may be asked for your passport when you pay.",
        },
        {
          icon: "money",
          title: "Keep small notes for bikes and tips",
          text: "Cash is no longer a bargain, but small notes help.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire a driver or take a tour",
          text: "The valley is about **1 hour** from Mendoza, up to **1h 30** to the far end. Do not mix tastings and driving.",
        },
        {
          icon: "car",
          title: "Leave by 08:00 for Aconcagua",
          text: "The road is **190 km** and takes **2h 20 to 3h** each way, so the day is **7 to 9 hours**. Do it from a Mendoza night, before you move to Uco.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Mendoza",
          tips: [
            {
              title: "Cycle the Maipú wineries",
              text: "Rent bikes in Maipú and check the shop's opening hours.",
            },
            {
              title: "See Cerro de la Gloria by day",
              text: "Evening visits to the hill are not recommended.",
            },
          ],
        },
        {
          place: "Uco valley",
          tips: [
            {
              title: "Book the asado lunch in the vines",
              text: "Zuccardi's lunch is booked through its own system. Lunch runs **12:30 to 14:00**.",
            },
          ],
        },
      ],
    },
    {
      stage: "Staying well",
      tips: [
        {
          icon: "lock",
          title: "Keep your phone hidden in downtown Mendoza",
          text: "The UK government warns of thieves on motorbikes who snatch bags and phones.",
        },
        {
          icon: "health",
          title: "Walk slowly at Puente del Inca",
          text: "It is about **2,700 m**. Drink water and skip a big lunch beforehand.",
        },
      ],
    },
  ],
};
