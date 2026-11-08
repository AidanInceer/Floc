import type { TripKnow } from "../../know-types";

export const PORTO_TO_SEVILLE: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Portugal", slug: "portugal" }, { country: "Spain", slug: "spain" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Book Pena palace online for a date",
          text: "Parques de Sintra requires a date reservation. Essential visit is **€20**, Full tour **€45**, Park only **€12**.",
          link: { label: "Parques de Sintra prices and booking", href: "https://www.parquesdesintra.pt/en/plan-your-visit/opening-times-and-prices/" },
        },
        {
          icon: "ticket",
          title: "Book the Alcázar and the cathedral online",
          text: "The Alcázar is **€15.50**. Seville cathedral and the Giralda are **€13** online.",
        },
        {
          icon: "weather",
          title: "Avoid Seville in July and August",
          text: "It reaches **40°C**. Spring and autumn are best.",
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
        {
          icon: "plane",
          title: "Fly into Porto and out of Seville",
          text: "This avoids doubling back.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Round up instead of tipping a lot",
          text: "The euro is used in both countries. Cards work almost everywhere.",
        },
        {
          icon: "food",
          title: "Refuse bread and olives you did not order",
          text: "On a Portuguese table they are charged.",
        },
        {
          icon: "car",
          title: "Set up electronic tolls at pickup",
          text: "Some Portuguese motorways have no booths. Easytoll costs **€1** plus **€0.32** a trip for 30 days. Via Verde Go Toll is **€0.77** a month plus **€0.32** a trip. Easytoll does not cover Lisbon's two river bridges: ask your hire firm.",
          link: { label: "Portugal tolls", href: "https://www.pttolls.com/" },
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Take the train from Porto to Lisbon",
          text: "The Alfa Pendular takes about **3h**. Seats are reserved, so book on cp.pt, and check which Lisbon station it arrives at.",
          link: { label: "Portuguese railway", href: "https://www.cp.pt" },
        },
        {
          icon: "car",
          title: "Collect the hire car as you leave Lisbon",
          text: "Do not drive in Lisbon or Porto. One-way drops into Spain cost extra, so ask before you book.",
        },
        {
          icon: "walk",
          title: "Move your clock one hour forward in Spain",
          text: "Spain is an hour ahead of Portugal. Lagos to Seville is **3h 30** with stops.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Porto",
          tips: [
            {
              title: "Taste port at 16:30 in Gaia",
              text: "Lodge hours vary and 19:00 may be too late. Check each lodge's closing time when booking, then walk the Ribeira at dusk.",
            },
            {
              title: "Go up the Douro by train",
              text: "There is no car in Porto. Trains to Pinhão take **2h 20 to 2h 30** and run about every two hours, so plan your return from Régua. Do not drive after a wine lunch.",
            },
          ],
        },
        {
          place: "Lisbon",
          tips: [
            {
              title: "Visit Jerónimos on any day but Monday",
              text: "It is shut on Mondays. Open Tuesday to Sunday **09:30 to 17:30**, last entry **17:00**, **€18**.",
            },
            {
              title: "Do Pena and Regaleira in Sintra, then stop",
              text: "Pena has no car access: take bus 434 from Sintra station. Cut Cabo da Roca; three stops plus buses is too much.",
            },
          ],
        },
        {
          place: "Évora",
          tips: [
            {
              title: "Allow 1h 30 for the drive to Évora",
              text: "The drive is about **1h 30** and crosses the Tagus by bridge.",
            },
          ],
        },
        {
          place: "Lagos",
          tips: [
            {
              title: "Do not promise yourself a Benagil cave stop",
              text: "Since August 2024 boat numbers and visit times are limited, and no landing on the beach. Go to Sagres for sunset instead.",
            },
            {
              title: "Book a flexible slot for kayaking",
              text: "Praia do Camilo is reached by a long wooden stairway, and tours depend on the swell.",
            },
          ],
        },
        {
          place: "Seville",
          tips: [
            {
              title: "Check the cathedral time on a Sunday",
              text: "It opens **10:45 to 18:00** Monday to Saturday and **14:30 to 19:00** on Sunday.",
            },
            {
              title: "Check the Alcázar's closed days",
              text: "It is shut on 1 January, 6 January, Good Friday and 25 December. It opens **09:30 to 17:00** from October to March and to **19:00** from April to September.",
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
          title: "Carry water and rest at midday in Seville",
          text: "Summer heat is severe.",
        },
        {
          icon: "lock",
          title: "Ride Tram 28 early, or walk",
          text: "It has queues and pickpockets. Avoid touts on Rua Augusta.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "food",
          title: "Eat later in Spain",
          text: "Spain eats at **21:00** or later. Portugal eats at about **19:30 to 20:30**.",
        },
        {
          icon: "chat",
          title: "Say obrigado or obrigada, and gracias in Spain",
          text: "Men say obrigado and women say obrigada.",
        },
      ],
    },
  ],
};
