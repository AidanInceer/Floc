import type { TripKnow } from "../../know-types";

export const SCOTTISH_HIGHLANDS_AND_SKYE: TripKnow = {
  checked: "2026-11-07",
  advice: [],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "pin",
          title: "Book Skye and Torridon beds first",
          text: "They fill early.",
        },
        {
          icon: "ticket",
          title: "Book Edinburgh Castle online",
          text: "It opens at **09:30** daily, but timed tickets often sell out far ahead.",
        },
        {
          icon: "ticket",
          title: "Book the Talisker tour ahead in summer",
          text: "Tours are limited in size.",
        },
        {
          icon: "train",
          title: "Wait for 2027 Jacobite train dates",
          text: "It runs from Fort William, not Glencoe. Only the 2027 season is listed, with dates and fares still to come.",
          link: { label: "West Coast Railways", href: "https://www.westcoastrailways.co.uk/jacobite/" },
          temporary: "Until the 2027 dates are out",
        },
        {
          icon: "weather",
          title: "Plan for midges in May to September",
          text: "May and September have fewer midges and crowds. Use a repellent with 20% picaridin and check the Scottish Midge Forecast.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get a UK electronic travel authorisation if needed",
          text: "It costs **£20**. British and Irish passport holders do not need one. Visitors from Europe, the United States, Australia and Canada usually do.",
          link: { label: "Apply on gov.uk", href: "https://www.gov.uk/guidance/electronic-travel-authorisation-eta" },
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "train",
          title: "Take the tram from Edinburgh airport",
          text: "It runs every **7 min**, from **06:30** to **22:52**, from **£7.90**. Tap a contactless card in and out.",
        },
        {
          icon: "car",
          title: "Ask about a one-way fee when you hire",
          text: "Firms often charge extra to drop a car in Inverness.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Add the Edinburgh visitor levy to your budget",
          text: "It is **5%** on paid stays from 24 July 2026, for up to **5 nights**, if you booked on or after 1 October 2025. The Highlands have no levy yet.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Pull in at passing places on single-track roads",
          text: "Wave oncoming cars through. Do not block them.",
        },
        {
          icon: "fuel",
          title: "Top up whenever you pass a fuel station",
          text: "Fuel stations are few in the north-west. Buy petrol in Kyle and Portree.",
        },
        {
          icon: "train",
          title: "Use the bus if you have no car",
          text: "Citylink from Glasgow to Glencoe takes about **2h 30**. The Ember bus from Edinburgh takes about **3h to 3h 30**.",
        },
        {
          icon: "car",
          title: "Allow 2h from Glencoe to Eilean Donan",
          text: "A 09:00 start reaches the castle at about 11:00. Skye Bridge has been toll-free since 2004.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Edinburgh",
          tips: [
            {
              title: "Climb Arthur's Seat in the late afternoon",
              text: "About **16:00** gives good evening light.",
            },
          ],
        },
        {
          place: "Glencoe",
          tips: [
            {
              title: "Start the Lost Valley walk early",
              text: "The ground is rough and there is a stream crossing. Wear boots, not trainers. There are no summits.",
            },
            {
              title: "Stop at Loch Lomond before Glencoe",
              text: "Edinburgh to Glencoe is about **3h**, so a longer Loch Lomond stop fits.",
            },
          ],
        },
        {
          place: "Isle of Skye",
          tips: [
            {
              title: "Do the Storr, Kilt Rock, then the Quiraing",
              text: "That order avoids backtracking. Start the Storr at **08:00**.",
            },
            {
              title: "Visit the Fairy Pools early or late",
              text: "The walk from the car park takes about **20 min**.",
            },
          ],
        },
        {
          place: "Torridon",
          tips: [
            {
              title: "Drive the Bealach na Bà in dry daylight",
              text: "It climbs **630 m** in about **6 km**, at nearly 20% steepness, on single track. It is unsuitable for learner drivers and very large vehicles, and often impassable in winter. The coast road via Shieldaig and Kenmore is the easy alternative.",
            },
            {
              title: "Treat Beinn Eighe as a scramble",
              text: "Beinn Eighe and Liathach have scrambling ridges with few escape points.",
            },
          ],
        },
        {
          place: "Inverness",
          tips: [
            {
              title: "Book Culloden ahead",
              text: "The visitor centre is **£12.50** for an adult, and the battlefield is free to walk.",
            },
          ],
        },
      ],
    },
    {
      stage: "Staying well",
      tips: [
        {
          icon: "weather",
          title: "Turn back if cloud drops",
          text: "Mountain weather changes fast.",
        },
        {
          icon: "shield",
          title: "Tell someone your route",
          text: "Phone signal is patchy in Glencoe and Torridon. Leave a route plan with your hosts.",
        },
      ],
    },
  ],
};
