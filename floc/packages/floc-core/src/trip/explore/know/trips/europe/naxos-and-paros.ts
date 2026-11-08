import type { TripKnow } from "../../know-types";

export const NAXOS_AND_PAROS: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Greece", slug: "greece" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go in June or September",
          text: "The meltemi wind blows from mid-May to mid-September and is strongest in July and August. Ferries can be cancelled in it.",
        },
        {
          icon: "pin",
          title: "Book July and August early",
          text: "Both islands are busy then.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport dates",
          text: "UK passports need no visa for **90 days** in any 180. The passport must be under **10 years** old and valid for **3 months** after you leave.",
          link: { label: "UK entry rules for Greece", href: "https://www.gov.uk/foreign-travel-advice/greece/entry-requirements" },
        },
        {
          icon: "passport",
          title: "Follow the officials at the border",
          text: "Greece has said it will not take fingerprints or photos from UK travellers under the EU's new Entry/Exit System (EES). Do what the officers ask on the day.",
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
          title: "Fly to Athens, then on to Paros",
          text: "Athens to Paros is a flight of **30 to 45 min**, or a ferry from Piraeus of about **2h 35** fast and up to **5h** slow. Blue Star sails daily all year; Seajets is more seasonal.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Keep cash for small tavernas and buses",
          text: "Cards work in most places.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "boat",
          title: "Check the Naxos ferry the night before",
          text: "The crossing takes about **46 min**. About 17 sail a week from June to September and about 10 from October to May. Blue Star and Seajets run it. Buy online or at the port.",
        },
        {
          icon: "train",
          title: "Use buses on both islands",
          text: "Buses link Parikia and Naoussa. Naxos has 10 bus lines, and some villages get only 3 buses a day.",
        },
        {
          icon: "car",
          title: "Hire a car or quad for the beaches",
          text: "Check the vehicle and the cover before you sign. Helmets are required, and a missing helmet can void your insurance.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Paros",
          tips: [
            {
              title: "Book ahead for a night or windy landing",
              text: "Room-sellers crowd the quay at Parikia.",
            },
          ],
        },
        {
          place: "Naxos",
          tips: [
            {
              title: "Check the Halki distillery hours locally",
              text: "It sells kitron, a lemony liqueur, but rarely runs tours, and no hours are published.",
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
          title: "Check your travel cover before riding a quad",
          text: "Many travel policies exclude quad biking.",
        },
        {
          icon: "health",
          title: "Stay out of the sea under red flags",
          text: "It means do not swim.",
        },
        {
          icon: "health",
          title: "Call 112 if you see a wildfire",
          text: "The risk runs from April to October.",
        },
      ],
    },
  ],
};
