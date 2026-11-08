import type { TripKnow } from "../../know-types";

export const UBUD_AND_NUSA_PENIDA: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Indonesia", slug: "indonesia" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go from April to October",
          text: "June to September is drier, and December to March brings heavy showers.",
        },
        {
          icon: "weather",
          title: "Check Nyepi if you travel in March",
          text: "Nyepi falls on about **8 March 2027**; check the date. Ports, the airport and roads close for about **24 hours**, so plan to be on the island.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get a visa",
          text: "UK passports need one. A **30-day** visa on arrival costs **500,000 rupiah**, or apply online at least a week ahead. Your passport needs **6 months** left and **2** blank pages.",
        },
        {
          icon: "money",
          title: "Pay the Bali levy",
          text: "It is **150,000 rupiah**, payable online or on arrival. It is required, and officials may check.",
          link: { label: "Pay at lovebali.baliprov.go.id", href: "https://lovebali.baliprov.go.id" },
        },
        {
          icon: "passport",
          title: "Fill in the free arrival card",
          text: "Do it within **72 hours** of landing.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Take Grab or a pre-booked driver to Ubud",
          text: "It is about **1h to 1h 30** by car. Agree the fare first.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Bring rupiah to Nusa Penida",
          text: "Cash machines on the island are few, so bring enough rupiah.",
        },
        {
          icon: "ticket",
          title: "Pay a fee at each Penida site",
          text: "Kelingking, Broken Beach and other major sites charge about **25,000 rupiah** each under a 2026 rule. Ask your driver what you owe.",
        },
        {
          icon: "ticket",
          title: "Budget for the Monkey Forest",
          text: "It has cost **130,000 rupiah** since 1 April 2026.",
        },
        {
          icon: "money",
          title: "Count the zeros at money changers",
          text: "Use only changers with a fixed shop. Keep small notes.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "boat",
          title: "Take the fast boat from Sanur",
          text: "It is advertised at **30 minutes** but often takes **45 to 50**. Boats run from about **06:30** to **17:00**, and one way costs **150,000 to 300,000 rupiah**. Use a company with a printed ticket.",
        },
        {
          icon: "car",
          title: "Allow time to drive from Ubud to Sanur",
          text: "Boats leave from Sanur, not Ubud. Allow **1h to 1h 30**.",
        },
        {
          icon: "car",
          title: "Hire a driver on Penida",
          text: "Do not count on ride-hailing there, and the roads are steep and rough. Use a driver for the west loop of Kelingking, Broken Beach, Angel's Billabong and Crystal Bay.",
        },
        {
          icon: "boat",
          title: "Sit at the back and wear a life jacket",
          text: "Crossings can be rough, and you will get wet boarding.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Ubud",
          tips: [
            {
              title: "Reach Tegallalang before 08:00",
              text: "Swings and coffee tasting stops there are paid extras.",
            },
            {
              title: "Use the meter on Bluebird taxis",
              text: "Taxi unions block pickups at some points. Ignore signs saying Grab is banned.",
            },
          ],
        },
        {
          place: "Nusa Penida",
          tips: [
            {
              title: "Skip the Kelingking descent if unfit",
              text: "It is a rugged **400 m** cliff path. Do not climb down in sandals or when wet.",
            },
            {
              title: "Join a boat trip to Manta Point",
              text: "Currents are strong and trips are boat-based.",
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
          title: "Keep food away from monkeys",
          text: "Monkeys at Ubud bite, and rabies is a risk from monkeys and dogs. Seek care for any bite.",
        },
        {
          icon: "sun",
          title: "Avoid Penida hikes from 10:00 to 14:00",
          text: "Heat reaches **40°C** with little shade.",
        },
        {
          icon: "drop",
          title: "Drink bottled water",
          text: "Stomach upsets are common.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Wear a sarong and sash at temples",
          text: "They are needed at every temple. Do not step on offerings in the street.",
        },
        {
          icon: "chat",
          title: "Say terima kasih",
          text: "It means thank you.",
        },
      ],
    },
  ],
};
