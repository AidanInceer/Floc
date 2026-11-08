import type { TripKnow } from "../../know-types";

export const LUANG_PRABANG_SLOW: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Laos", slug: "laos" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go from November to February",
          text: "It is cool and clear. Smoke from burning starts in late February and lasts to April.",
        },
        {
          icon: "train",
          title: "Buy the Vang Vieng train ticket when sales open",
          text: "Tickets go on sale **7 days** before travel and sell out. Use the official ticket app; a town ticket office is the fallback.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get a visa",
          text: "UK passports get a **30-day** visa on arrival, including at Luang Prabang airport, or a single-entry online visa applied for **5 days** ahead. Your passport needs **6 months** left and **2** blank pages.",
        },
        {
          icon: "money",
          title: "Bring clean US dollars for the visa",
          text: "The visa on arrival costs about **US$35**. Pay in cash, with a passport photo.",
        },
        {
          icon: "passport",
          title: "Fill in the Lao Digital Immigration Form",
          text: "Do it up to **3 days** before you arrive.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "pin",
          title: "Agree the fare before you get in",
          text: "The airport is **4 km** from town. Or ask your hotel to arrange the transfer.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Use cash machines on Sisavangvong Road",
          text: "Limits are about **1,000,000 to 2,000,000 kip**, with a fee.",
        },
        {
          icon: "shield",
          title: "Carry your bag away from the road",
          text: "The UK government reports random bag snatches by people on motorbikes.",
        },
        {
          icon: "ticket",
          title: "Pay for Kuang Si in kip",
          text: "Entry is **60,000 kip**, and it is open **08:00 to 17:30**.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Allow 40 minutes to Luang Prabang station",
          text: "It is **12 km** from the old town. A shared minibus costs about **40,000 kip**, a private minivan about **50,000 kip**. The train itself takes about **1 hour**.",
        },
        {
          icon: "car",
          title: "Take a minivan from Vang Vieng station",
          text: "The station is **3 km** north of town. Minivans and green minibuses cost about **40,000 kip**.",
        },
        {
          icon: "car",
          title: "Go to Kuang Si by shared tuk-tuk or van",
          text: "It is about **30 km** out, and the road is dangerous on a scooter.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Luang Prabang",
          tips: [
            {
              title: "Watch the alms round from a distance",
              text: "It runs **05:00 to 06:00** on Sisavangvong Road. Give food only if you made it yourself, and do not touch monks.",
            },
            {
              title: "Plan around early closing times",
              text: "Bars close by **23:30**, the night market shuts at about **22:00**, and the Phousi ticket office closes at **18:30**.",
            },
          ],
        },
        {
          place: "Vang Vieng",
          tips: [
            {
              title: "Return tubes by 18:00",
              text: "Tubing costs about **55,000 kip** plus a **60,000 kip** deposit, and **20,000 kip** comes off if you are late. Start between **12:00 and 14:00** and wear a lifejacket.",
            },
            {
              title: "Swim at the Blue Lagoon",
              text: "It is open **08:00 to 18:00** and costs **10,000 kip**.",
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
          title: "Drink sealed Beerlao only",
          text: "Methanol in spirits has killed tourists, including six in Vang Vieng in November 2024. Stick to sealed bottles and cans.",
        },
        {
          icon: "shield",
          title: "Stay on main routes in rural areas",
          text: "Unexploded bombs remain. Do not pick up metal objects.",
        },
        {
          icon: "health",
          title: "Carry insurance for treatment and evacuation",
          text: "Outside the capital there are no reliable emergency facilities. Dengue and malaria both occur.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Cover shoulders and knees at temples",
          text: "Dress modestly in the old town too.",
        },
        {
          icon: "lock",
          title: "Never leave your passport as a deposit",
          text: "Some motorbike shops arrange a fake damage claim.",
        },
      ],
    },
  ],
};
