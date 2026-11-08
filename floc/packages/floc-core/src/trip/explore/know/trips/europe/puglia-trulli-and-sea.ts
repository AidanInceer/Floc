import type { TripKnow } from "../../know-types";

export const PUGLIA_TRULLI_AND_SEA: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Italy", slug: "italy" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "car",
          title: "Hire a car at Bari airport",
          text: "You need one on this trip. Book early for summer.",
        },
        {
          icon: "boat",
          title: "Book sea cave boats ahead",
          text: "Do it especially in July and August.",
        },
        {
          icon: "weather",
          title: "Go in May, June, September or early October",
          text: "Summer is the busiest time, and Lama Monachile is crowded.",
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
          link: { label: "UK entry rules for Italy", href: "https://www.gov.uk/foreign-travel-advice/italy/entry-requirements" },
        },
        {
          icon: "passport",
          title: "Expect fingerprints at your first entry",
          text: "The EU's new Entry/Exit System (EES) may take fingerprints and a photo.",
          link: { label: "Read the UK guide to the Entry/Exit System", href: "https://www.gov.uk/guidance/eu-entryexit-system" },
        },
        {
          icon: "car",
          title: "Check your driving licence",
          text: "A UK photocard licence is valid in Italy. A paper licence may need an International Driving Permit (**£5.50**), and hire firms often ask for one.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly to Bari, or Brindisi",
          text: "Alberobello is under an hour from Bari by car. A Tempesta shuttle runs to Bari Centrale for about **€4** one way; check the price and time.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry cash for small trattorie and beach clubs",
          text: "Cards work in the towns.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Drive between the two bases",
          text: "Alberobello to Polignano a Mare takes about **40 min** by car. No direct train runs.",
        },
        {
          icon: "train",
          title: "Take the Sud-Est train from Bari to Alberobello",
          text: "It takes **1h 30 to 2h** and starts from about **€5**. Check fseonline.it. The station is next to the main one, with its own entrance.",
        },
        {
          icon: "car",
          title: "Keep out of the historic centres",
          text: "They are restricted traffic zones, and cameras fine cars without a pass. Ask your host to register your plate.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Alberobello",
          tips: [
            {
              title: "Walk Rione Monti and Aia Piccola at 08:00",
              text: "Go before the tour groups arrive.",
            },
            {
              title: "Eat a few streets from the trulli centre",
              text: "The meals are better.",
            },
          ],
        },
        {
          place: "Polignano a Mare",
          tips: [
            {
              title: "Swim at Lama Monachile early or late",
              text: "The cove is small and crowded in summer. Sea caves such as Grotta delle Rondinelle can be entered from the sea.",
            },
            {
              title: "Try the caffè speciale",
              text: "It is warm coffee with lemon zest, cream and amaretto. Cave restaurants such as Grotta Palazzese cost far more.",
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
          title: "Watch for pickpockets; stay out under red flags",
          text: "A red flag at a beach means do not swim.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "food",
          title: "Try panzerotto, focaccia barese and orecchiette",
          text: "Orecchiette comes with cime di rapa, a bitter green.",
        },
        {
          icon: "customs",
          title: "Plan around the afternoon shutdown",
          text: "Many places shut after lunch.",
        },
      ],
    },
  ],
};
