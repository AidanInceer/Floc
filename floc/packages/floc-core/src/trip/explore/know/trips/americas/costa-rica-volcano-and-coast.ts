import type { TripKnow } from "../../know-types";

export const COSTA_RICA_VOLCANO_AND_COAST: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Costa Rica", slug: "costa-rica" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Pick your month for the turtles",
          text: "Green turtles nest from June to October, best from late July to mid-September. Leatherbacks nest roughly March to June and are rarely seen. December and January have no nesting.",
        },
        {
          icon: "ticket",
          title: "Buy Manuel Antonio tickets with your flights",
          text: "Tickets are online only, with no sales at the gate and a daily limit. They can sell out days or weeks ahead. The park is closed on Tuesdays.",
        },
        {
          icon: "ticket",
          title: "Book the Monteverde walks online",
          text: "The guided walk starts at **07:30** and the night walk at **18:00**. Slots follow the shuttle time, so arrive **15 minutes** early.",
          link: { label: "Monteverde Cloud Forest Preserve", href: "https://cloudforestmonteverde.com" },
        },
        {
          icon: "weather",
          title: "Pack a poncho for Tortuguero",
          text: "It rains all year there, about **3,000 mm**.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport dates",
          text: "UK passports need no visa for up to **180 days**, at the officer's discretion. The passport must be valid until the day after you leave.",
        },
        {
          icon: "money",
          title: "Check your ticket includes the departure tax",
          text: "The tax is **US$29** and is usually in the ticket. If not, pay at the airport by cash or card.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly to San José, hire the car later",
          text: "The loop starts and ends there. Pick up your hire car in La Fortuna, not at the airport.",
        },
        {
          icon: "customs",
          title: "Bring a US-style plug adaptor",
          text: "Sockets are the American type, at **120 volts**.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry colones for buses and small shops",
          text: "Dollars and cards work at lodges and parks. Petrol stations take dollars and colones.",
        },
        {
          icon: "ticket",
          title: "Pay for Arenal park by card",
          text: "The fee is **US$15** and the entrance takes cards only.",
        },
        {
          icon: "ticket",
          title: "Budget for hot springs",
          text: "Prices run from about **US$47** at Baldí to about **US$89** at Tabacón, so check before you go.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "boat",
          title: "Take a shuttle and a boat to Tortuguero",
          text: "There is no road. The public route is a **09:00** bus and a boat of up to **2h**, arriving at about **15:00**. Public boats leave Tortuguero at **06:00**, **11:30** and **15:00**: ask at the dock.",
        },
        {
          icon: "car",
          title: "Ride jeep-boat-jeep to Monteverde",
          text: "Without a car, this takes **3 to 4 hours** and costs **US$20 to 25**. By hire car, the drive from La Fortuna takes **3 to 4 hours** round Lake Arenal.",
        },
        {
          icon: "moon",
          title: "Do not drive at night",
          text: "Roads have potholes and one-lane bridges.",
        },
        {
          icon: "car",
          title: "Photograph the hire car, and check the deposit",
          text: "Full cover adds about **US$15 to 20** a day, with a deposit from **US$750** on a credit card. Firms may claim damage you did not cause.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "San José",
          tips: [
            {
              title: "Book a shuttle for an early boat",
              text: "The public bus gets you to Tortuguero by about **15:00**. A shuttle with an early start reaches the earlier boat.",
            },
          ],
        },
        {
          place: "Tortuguero",
          tips: [
            {
              title: "Buy the Tortuguero park fee online",
              text: "The fee is **US$17** plus tax for foreign adults. Check if your guide includes it.",
            },
            {
              title: "Use a certified guide for night beach walks",
              text: "Ask to see the guide's card. You also need a spotter sticker of **US$4**. This is possible only in turtle season.",
            },
          ],
        },
        {
          place: "La Fortuna",
          tips: [
            {
              title: "Go to the waterfall at 07:30",
              text: "It costs **US$20** and the entrance closes at **17:00**. The steps take about **10 min** down and **20 min** up.",
            },
            {
              title: "Ignore touts near the bus station",
              text: "Some pose as information. A man on the early bus may get off at a private park that charges **US$15**: it is not the national park.",
            },
          ],
        },
        {
          place: "Monteverde",
          tips: [
            {
              title: "Do not arrive late for the night walk",
              text: "The listed window runs from **18:00 to 18:30**, so a later start can miss it.",
            },
          ],
        },
        {
          place: "Manuel Antonio",
          tips: [
            {
              title: "Enter the park when it opens",
              text: "Gates open at about **07:00** and the park closes at about **16:00**. Bring your passport: the ticket asks for the number.",
            },
            {
              title: "Leave by 07:00 for a 14:00 flight",
              text: "The airport is about **3h** away, from **2h 30** to **4h**. Or book a flight after **15:00**.",
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
          title: "Use repellent all day",
          text: "The UK government lists dengue, Zika and malaria. Mosquitoes that carry dengue bite by day.",
        },
        {
          icon: "sun",
          title: "Ask locally before you swim",
          text: "Rip currents are common and lifeguards are rare. Crocodiles live along the coast from Playa Azul to Playa Esterillos.",
        },
        {
          icon: "lock",
          title: "Keep bags out of parked cars",
          text: "Do not leave anything in a parked car, even for a minute.",
        },
        {
          icon: "shield",
          title: "Keep driving past strangers who flag you down",
          text: "Do not stop for strangers who signal for help.",
        },
        {
          icon: "weather",
          title: "Stay off volcano trails in heavy rain",
          text: "Avoid volcanoes during and after heavy rain.",
        },
      ],
    },
  ],
};
