import type { TripKnow } from "../../know-types";

export const PALAWAN_ISLAND_HOP: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Philippines", slug: "philippines" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go from December to May",
          text: "December to February is peak. Typhoon season runs June to November, and boat accidents are more common from June to December.",
        },
        {
          icon: "boat",
          title: "Plan an early fast ferry to Coron",
          text: "It takes about **3h 30 to 4h**, with a morning departure such as **06:00** or **08:20**. Confirm the operator and time a few days ahead, and keep a spare day, as delays of up to an hour happen.",
        },
        {
          icon: "boat",
          title: "Skip the slow outrigger boat",
          text: "It takes about **8 hours** and runs on set days only.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Count on 30 days visa-free",
          text: "UK passports get **30 days**. Your passport needs **6 months** left.",
        },
        {
          icon: "passport",
          title: "Register on eTravel for a QR code",
          text: "It is free. Do it within **72 hours** before you arrive.",
        },
        {
          icon: "plane",
          title: "Carry proof of onward travel",
          text: "Airlines and immigration may ask for it.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly to Puerto Princesa, then take a van",
          text: "Fly via Manila or Cebu. The van to El Nido costs **600 to 700 pesos**, takes **4 to 5 hours** and leaves when full.",
        },
        {
          icon: "plane",
          title: "Fly out of Coron",
          text: "It skips the ferry back.",
        },
        {
          icon: "shield",
          title: "Insist on the terminal in Puerto Princesa",
          text: "Taxis steer you to pricey chartered vans for commission.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Bring pesos from Puerto Princesa",
          text: "El Nido cash machines run out at weekends and on holidays.",
        },
        {
          icon: "ticket",
          title: "Pay the El Nido environmental fee in cash",
          text: "It is **400 pesos** per person, valid **10 days**, and not in online tour prices.",
        },
        {
          icon: "ticket",
          title: "Pack cash for lagoon and Coron site fees",
          text: "The Big and Small Lagoons add about **200 pesos** each. Kayangan is about **300 pesos**, Twin Lagoon and Skeleton Wreck about **100 pesos** each, and Maquinit **300 pesos**.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Take travel-sickness tablets for the vans",
          text: "They leave only when full and drive fast.",
        },
        {
          icon: "car",
          title: "Use tricycles in town",
          text: "Coron has no taxis, and a ride is about **30 pesos** a person. Agree the price first.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "El Nido",
          tips: [
            {
              title: "Book Tour A for the Big Lagoon",
              text: "Shared island tours cost **1,200 to 1,500 pesos**, and private boats **8,500 to 10,500 pesos**.",
            },
            {
              title: "Check lifejackets before the boat leaves",
              text: "Some cheap tours use overcrowded boats.",
            },
            {
              title: "Ride to Nacpan Beach in dry weather",
              text: "The road is unpaved and muddy when wet.",
            },
          ],
        },
        {
          place: "Coron",
          tips: [
            {
              title: "Snorkel the wreck from Banol beach",
              text: "Sea urchins and current make shore snorkelling tricky. Diving inside wrecks needs a trained diver.",
            },
            {
              title: "Buy Kayangan tickets in town",
              text: "Do this before the trip, and bring cash.",
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
          title: "Use a reputable ferry operator",
          text: "The UK government says the ferry network has a poor safety record and names Coron among places with sexual assaults on British nationals.",
        },
        {
          icon: "health",
          title: "Dive only with an operator that carries oxygen",
          text: "Check their credentials and safety plan. Sea urchins and some jellyfish are around the wrecks and beaches.",
        },
        {
          icon: "weather",
          title: "Check the forecast and skip crowded boats",
          text: "Use the weather service forecast. Do not board an overloaded boat.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "money",
          title: "Tip boat crews with small notes",
          text: "It is welcome but not expected.",
        },
        {
          icon: "lock",
          title: "Expect power cuts and slow internet",
          text: "Cuts are random in El Nido, and the internet is slow in Coron town.",
        },
      ],
    },
  ],
};
