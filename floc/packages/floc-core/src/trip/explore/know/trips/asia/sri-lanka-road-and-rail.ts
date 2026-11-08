import type { TripKnow } from "../../know-types";

export const SRI_LANKA_ROAD_AND_RAIL: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Sri Lanka", slug: "sri-lanka" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "train",
          title: "Book the Ella train the day seats open",
          text: "Seats go on sale **30 days** ahead on the Sri Lanka Railways website and sell out fast.",
        },
        {
          icon: "car",
          title: "Book safari jeeps through your lodge",
          text: "Yala only lets in licensed jeeps with a driver. Your lodge arranges both.",
        },
        {
          icon: "weather",
          title: "Go between December and March",
          text: "These are the usual dry months. Floods and landslides still happen, so read the UK government's advice first.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get your entry permit online",
          text: "UK passports need a free electronic travel authorisation (ETA), valid **30 days**. Use only the official site: copycat sites charge.",
          link: { label: "Apply at eta.gov.lk", href: "https://eta.gov.lk" },
        },
        {
          icon: "passport",
          title: "Check your passport has 6 months left",
          text: "It needs **6 months** left on the day you arrive.",
        },
        {
          icon: "plane",
          title: "Check your flight with your airline",
          text: "Flights from the UK via Gulf hubs are affected by Middle East airspace closures.",
          temporary: "Until the airspace closures end",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "pin",
          title: "Allow up to an hour into Colombo",
          text: "The airport is at Katunayake, **35 km** north of the city: **40 min to 1h** by car.",
        },
        {
          icon: "money",
          title: "Take cash from a machine inside a bank",
          text: "The UK government warns of card fraud at street machines.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "ticket",
          title: "Budget for Sigiriya",
          text: "**US$30 to 36** for a foreign adult. Polonnaruwa is a separate ticket.",
        },
        {
          icon: "ticket",
          title: "Buy temple tickets inside the temple",
          text: "The Temple of the Tooth is **3,000 rupees** for most foreign visitors, from the machines inside only.",
        },
        {
          icon: "money",
          title: "Carry small notes outside the towns",
          text: "Jeeps and whale boats quote in rupees or US dollars.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire a car with a driver",
          text: "It is the normal way round. Roads are slow: allow **25 to 30 km** an hour.",
        },
        {
          icon: "train",
          title: "Take the train from Nanu Oya",
          text: "Storm damage cut the line from Kandy. Drive to Nanu Oya by Nuwara Eliya, then take the train to Ella, about **2h 30**.",
          temporary: "Until the Kandy line reopens",
        },
        {
          icon: "fuel",
          title: "Let your driver sort the fuel",
          text: "Each vehicle has a weekly fuel limit. Drivers and hotels have their own arrangements.",
        },
        {
          icon: "shield",
          title: "Avoid motorbikes and night driving",
          text: "They are the main risks on the road.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Sigiriya",
          tips: [
            {
              title: "Be at the gate when it opens",
              text: "The gate opens at about **07:00**; check on the day. The stairs get busy from **09:00**. For sunrise, climb Pidurangala rock next door.",
            },
            {
              title: "See elephants at Kaudulla",
              text: "Herds often move to Kaudulla from October to December, so ask your guide about recent sightings. Minneriya's big gathering is July to October.",
            },
          ],
        },
        {
          place: "Kandy",
          tips: [
            {
              title: "Go at a ceremony time",
              text: "The relic room of the Temple of the Tooth opens only at **05:30**, **09:30** and **18:30**.",
            },
          ],
        },
        {
          place: "Yala",
          tips: [
            {
              title: "Ask your lodge if Yala is open",
              text: "Parts of Yala close in drought. Check before you plan a safari.",
            },
          ],
        },
        {
          place: "Galle",
          tips: [
            {
              title: "Leave early for the whale boats",
              text: "They sail from Mirissa, **45 to 60 min** east, November to April.",
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
          title: "Use repellent and keep away from street dogs",
          text: "Put repellent on at dusk. Rabies is in street dogs: see a doctor the same day for any bite.",
        },
        {
          icon: "shield",
          title: "Ask before you swim",
          text: "Surf and rips on the beaches are strong. Your hotel knows the safe ones.",
        },
        {
          icon: "shield",
          title: "Stay back from wild animals",
          text: "Elephants and crocodiles do attack people. Follow your guide.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Dress for temples",
          text: "Shoulders and knees covered, shoes and hats off.",
        },
        {
          icon: "customs",
          title: "Never pose with your back to a Buddha",
          text: "It gives offence. Cover a Buddha tattoo too: it can get you refused entry.",
        },
        {
          icon: "chat",
          title: "Say hello in Sinhala",
          text: "Ayubowan is hello. Istuti is thank you.",
        },
      ],
    },
  ],
};
