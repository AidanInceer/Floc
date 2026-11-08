import type { TripKnow } from "../../know-types";

export const OKAVANGO_DELTA_SHORT: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Botswana", slug: "botswana" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go between June and September",
          text: "The flood peaks June to August. Malaria risk is low only June to September. October is hot, can pass **40°C**, and has high malaria risk.",
        },
        {
          icon: "ticket",
          title: "Book delta camps 6 to 12 months ahead",
          text: "Camps are few and small, and June to September sells out.",
        },
        {
          icon: "boat",
          title: "Ask the camp about the water",
          text: "Mokoro (canoe) trips and walks depend on the water, and some camps do only one of them.",
        },
        {
          icon: "health",
          title: "Buy insurance that covers medical evacuation",
          text: "Care outside towns is limited.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport",
          text: "UK passports need no visa for up to **90 days**. The passport needs **6 months** left and **3** blank pages.",
        },
        {
          icon: "plane",
          title: "Fly into Maun via a regional hub",
          text: "There are no direct flights from the UK. Johannesburg and Cape Town have direct routes to Maun: check the days.",
        },
        {
          icon: "plane",
          title: "Pack in a soft bag",
          text: "Light aircraft allow about **20 kg** including hand luggage and camera kit. Confirm with the camp and leave the rest at your Maun hotel.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Ask the camp what the price covers",
          text: "Fly-in camps are usually all-inclusive. Ask how extras and tips are paid, and tip guides and trackers at the end.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "plane",
          title: "Allow 15 to 40 minutes for camp flights",
          text: "Farther camps take longer.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Maun",
          tips: [
            {
              title: "Use licensed taxis with blue plates",
              text: "Violent crime is rising in Maun.",
            },
          ],
        },
        {
          place: "Okavango delta",
          tips: [
            {
              title: "Download maps before you fly",
              text: "Signal in remote camps is patchy. Ask the camp.",
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
          title: "Take malaria cover and repellent",
          text: "Malaria risk is low June to September and high October to May. Ask a clinic. Ticks and schistosomiasis (a parasite in fresh water) are listed risks.",
        },
        {
          icon: "drop",
          title: "Stay out of rivers and lakes",
          text: "Animals and disease are the risk. Do not touch carcasses: anthrax occurs in wild animals.",
        },
        {
          icon: "shield",
          title: "Obey your guide",
          text: "Wild animals are unpredictable.",
        },
        {
          icon: "weather",
          title: "Bring a fleece for June to August",
          text: "Dawns are cold and days are warm. Nights can fall near freezing.",
        },
      ],
    },
  ],
};
