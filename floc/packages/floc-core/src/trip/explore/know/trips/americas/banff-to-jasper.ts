import type { TripKnow } from "../../know-types";

export const BANFF_TO_JASPER: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Canada", slug: "canada" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Reserve the Lake Louise and Moraine Lake shuttle",
          text: "Moraine Lake Road is closed to private cars all year. In 2026 bookings opened on 15 April at **08:00** (Mountain time), with **40 percent** of seats released then and the rest 2 days before. The 2027 dates are not yet published.",
          link: { label: "Lake Louise shuttle", href: "https://parks.canada.ca/lakelouise-transit" },
          temporary: "Until the 2027 dates are published",
        },
        {
          icon: "weather",
          title: "Go between June and September",
          text: "The teahouse and the shuttles run in these months. Winter tyres or chains are required on the Icefields Parkway from **1 November to 1 April**.",
        },
        {
          icon: "car",
          title: "Plan a full day for the Icefields Parkway",
          text: "The road is **232 km**. Expect about **5h** non-stop, plus **45 min** from Banff to the start. With stops, allow **6 to 8 hours**.",
        },
        {
          icon: "shield",
          title: "Skip Maligne Canyon and Miette Hot Springs",
          text: "The canyon trailhead is closed for the 2026 season, with no reopening date. Miette Hot Springs is also closed for 2026 and returns in spring 2027.",
          link: { label: "What is open in Jasper", href: "https://parks.canada.ca/pn-np/ab/jasper/visit/ouvert-fermee-open-closed" },
          temporary: "Until the trails reopen",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get your Canada travel permit online",
          text: "UK passports need no visa for short visits, but you need an eTA (electronic travel authorization) to fly in. It costs **7 Canadian dollars**.",
          link: { label: "Apply for an eTA", href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta/apply.html" },
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly into Calgary, check fares home from Edmonton",
          text: "Drive to Banff from Calgary. One-way fares home from Edmonton avoid the return drive.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "ticket",
          title: "Buy a Parks Canada pass",
          text: "It is about **25 Canadian dollars** a day for a group of up to 7, or **12.25** per adult.",
        },
        {
          icon: "ticket",
          title: "Add the shuttle fee to your budget",
          text: "The booking fee is **3.50 Canadian dollars** online. It does not include the park pass.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "fuel",
          title: "Fill up at Lake Louise",
          text: "The only fuel on the Icefields Parkway is at Saskatchewan River Crossing, from April or May to October.",
        },
        {
          icon: "walk",
          title: "Download maps before you set out",
          text: "There is no mobile signal on the Parkway. Save your pass offline too.",
        },
        {
          icon: "weather",
          title: "Check Alberta road reports",
          text: "The Parkway can close for avalanches and snow. Use the 511 Alberta site before you set out.",
        },
        {
          icon: "train",
          title: "Ride the bus from Banff to Lake Louise",
          text: "Roam Transit 8X runs all year. Book in summer.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Banff",
          tips: [
            {
              title: "Use the Park and Ride, not the lakeshore",
              text: "The Lake Louise lot often fills before sunrise. The Park and Ride runs from **06:00 to 20:00**. Missing the last Moraine return means paying for your own taxi.",
            },
            {
              title: "Hike to Lake Agnes teahouse",
              text: "It is **3.5 km** one way. The 2025 season ran from early June to early October, **08:00 to 16:00**, first come first served. Check the 2026 dates before you go.",
            },
          ],
        },
        {
          place: "Jasper",
          tips: [
            {
              title: "Go to Maligne Lake instead",
              text: "Maligne Road and the lake reopened in October 2024. Check Parks Canada before you go for boat cruise dates.",
            },
          ],
        },
      ],
    },
  ],
};
