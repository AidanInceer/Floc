import type { TripKnow } from "../../know-types";

export const CAPE_TOWN_AND_WINELANDS: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "South Africa", slug: "south-africa" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Keep a spare day for wind",
          text: "October to April is the usual season, but summer wind closes the cable car and Chapman's Peak road. Hot, dry weather also brings wildfires.",
        },
        {
          icon: "ticket",
          title: "Check the wine tram timetable and book",
          text: "The tram does not run every line every day. Timetables change by month, and roadworks can change lines.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport",
          text: "UK passports need no visa for up to **90 days**. The passport must be valid **30 days** after you leave and have **2** blank pages.",
        },
        {
          icon: "customs",
          title: "File the online traveller declaration",
          text: "Since 1 July 2026 the South African Revenue Service asks for it before you enter and before you leave. Missing it will not stop you, but file first.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Take the N2 and M3 from the airport",
          text: "The UK government advises against the R300 road. Franschhoek is **1h to 1h 15** by road, more in rush hour.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "ticket",
          title: "Pay the cape park fees by card",
          text: "From 1 November 2026, Cape Point is **R592** and Boulders is **R282** (South African rand) per foreign adult. The gates take cards only.",
        },
        {
          icon: "ticket",
          title: "Buy the cable car ticket online",
          text: "An adult return is **R475** (South African rand) online and **R530** at the desk. A ticket is valid for **7 days**, so you can use it on the next open day.",
          link: { label: "Table Mountain cable car prices", href: "https://www.tablemountain.net/plan-your-visit/ticket-prices/" },
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Use the official ride-hailing app",
          text: "Do not accept offers from drivers who approach you. Do not use public buses to the townships.",
        },
        {
          icon: "food",
          title: "Use the tram or a driver for tastings",
          text: "Tastings and driving do not mix. In the winelands use the wine tram, a driver or e-bikes.",
        },
        {
          icon: "car",
          title: "Expect a toll on Chapman's Peak",
          text: "It is a toll road and shuts in strong wind.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Cape Town",
          tips: [
            {
              title: "Hike in a group of 4 or more",
              text: "On Lion's Head or Platteklip Gorge, the UK government advises groups of **4 or more**, on marked trails, starting early and finishing before dark. Muggings have hit hikers.",
            },
            {
              title: "Keep a spare slot for the cable car",
              text: "It was shut for wind and cold on 5 November 2026.",
            },
          ],
        },
        {
          place: "Franschhoek",
          tips: [
            {
              title: "Ride the wine tram between farms",
              text: "It is a hop-on, hop-off tram and open-air bus at about **R370** (South African rand).",
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
          title: "Keep to busy places after dark",
          text: "Carjackings happen at junctions and petrol stations after dark. Violent crime can happen in tourist areas.",
        },
        {
          icon: "health",
          title: "Keep away from seals and baboons",
          text: "Rabies has been found in seals on the Cape coast. Do not touch seals or feed baboons.",
        },
        {
          icon: "lock",
          title: "Carry a torch and power bank",
          text: "Power cuts are much reduced but can still stop cash machines and traffic lights.",
        },
      ],
    },
  ],
};
