import type { TripKnow } from "../../know-types";

export const PORT_DOUGLAS_AND_DAINTREE: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Australia", slug: "australia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Travel from May to October",
          text: "This is the dry season with the lowest stinger risk. December to March is hot and wet, and floods can close roads and the ferry.",
        },
        {
          icon: "ticket",
          title: "Book the reef boat and lodge early",
          text: "Both sell out in the dry season.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Apply for the free eVisitor before you fly",
          text: "A UK passport can use the free eVisitor, or the electronic travel authorisation app, which may add a service fee. Apply before you fly.",
        },
        {
          icon: "shield",
          title: "Buy travel insurance",
          text: "The UK agreement covers urgent hospital care. Insure for the rest.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly into Cairns",
          text: "Port Douglas is about **1 hour** north by hire car or shuttle.",
        },
        {
          icon: "customs",
          title: "Declare food and wood",
          text: "Boots may be checked.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry some cash north of the river",
          text: "Cards work in Port Douglas, but small stalls north of the river may want cash and signal is patchy.",
        },
        {
          icon: "ticket",
          title: "Check the reef charge is in the fare",
          text: "The reef charge is **A$8.50** a day, or **A$4.25** for part of a day, since 1 April 2026.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire a car and drive on the left",
          text: "Cape Tribulation is about **2.5 hours** from Cairns. The road is sealed. The Bloomfield Track beyond it needs a four-wheel drive.",
        },
        {
          icon: "boat",
          title: "Buy the Daintree ferry ticket online",
          text: "The ferry runs **05:00 to midnight**. Buy a ticket online and save the code, or pay at the booth. Signal is poor there. A new operator took over on 1 July 2026 and fares changed, so check the price.",
          link: { label: "See ferry tickets and prices", href: "https://daintreeferry.com.au/tickets-prices/" },
        },
        {
          icon: "fuel",
          title: "Fill up before you cross the river",
          text: "The only fuel stop north of it is Diwan.",
        },
        {
          icon: "weather",
          title: "Expect queues at the ferry",
          text: "Works on the approach road can cause queues.",
          temporary: "Until the approach road is widened",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Port Douglas",
          tips: [
            {
              title: "Pick a small boat for the outer reef",
              text: "The cheapest big-boat trips are the most crowded. The Quicksilver boat to Agincourt Reef leaves at **10:00** and returns at **16:30**.",
            },
            {
              title: "Check the shuttle price for Mossman Gorge",
              text: "The visitor centre is free but the gorge needs the shuttle. The shuttle is about **A$15** for an adult, so check the price when you go.",
            },
          ],
        },
        {
          place: "Cape Tribulation",
          tips: [
            {
              title: "Download offline maps before you cross",
              text: "Mobile signal is patchy north of the river and gaps are common around Cape Tribulation.",
            },
            {
              title: "Book the crocodile cruise separately",
              text: "The ferry only takes you north across the river. The river cruise is a separate boat trip.",
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
          title: "Never swim in Daintree creeks or beaches",
          text: "Crocodiles live there. Obey the signs and do not wade.",
        },
        {
          icon: "drop",
          title: "Wear a stinger suit from November to May",
          text: "Boats lend suits. Check the Surf Life Saving Queensland stinger update for net status.",
        },
        {
          icon: "sun",
          title: "Use strong sun protection all year",
          text: "The sun is very strong in the tropics.",
        },
        {
          icon: "walk",
          title: "Keep your distance from cassowaries",
          text: "They are shy and can strike.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Buy a digital SIM card before you land",
          text: "A digital SIM card (eSIM) is a phone plan you set up on your phone with no plastic card.",
        },
      ],
    },
  ],
};
