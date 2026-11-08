import type { TripKnow } from "../../know-types";

export const FIJI_YASAWA_ISLANDS: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Fiji", slug: "fiji" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Travel from May to October",
          text: "This is the dry season and the main manta ray season. Cyclone season runs November to April.",
        },
        {
          icon: "boat",
          title: "Sleep near Naviti and Drawaqa for manta rays",
          text: "The manta passage lies between those islands. Mantaray Island and Barefoot Manta are **2 hours 50** from Port Denarau on the Flyer; Nacula is over **4 hours** away. Stay **3 days or more** to improve your odds.",
        },
        {
          icon: "boat",
          title: "Book the Flyer with Yasawa Adventures Fiji",
          text: "The company was known as Awesome Adventures until February 2026.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport and onward ticket",
          text: "The passport must be valid **6 months** past arrival. You need an onward ticket. No visa is needed for up to **4 months**.",
        },
        {
          icon: "shield",
          title: "Buy insurance for diving and evacuation",
          text: "Fiji has one decompression chamber, in Suva, and it is not always working. Hospitals ask for cash first.",
        },
        {
          icon: "customs",
          title: "Declare cash of 10,000 Fiji dollars or more",
          text: "The limit is **10,000 Fiji dollars**.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Connect on the way from the UK",
          text: "No direct UK flights run to Nadi. Connect through Singapore, Hong Kong or Los Angeles; check the routes. Nadi is the only airport you need.",
        },
        {
          icon: "ticket",
          title: "Check your fare includes departure tax",
          text: "The departure tax is **200 Fiji dollars** since 1 August 2025. Ask your airline whether it is in the ticket.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Draw cash before you leave the main island",
          text: "Cash is the safest way to pay on the islands.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "boat",
          title: "Plan the whole day around the Yasawa Flyer",
          text: "It is the only daily boat for the chain. It leaves Port Denarau by **08:45**, check in **30 minutes** early, and is back at Denarau about **18:00**. Check the stop-by-stop timetable.",
          link: { label: "See the Flyer timetable", href: "https://www.yasawafiji.com/maps-and-timetables/" },
        },
        {
          icon: "boat",
          title: "Expect long boat times north",
          text: "The first stops are South Sea Island (**30 minutes**) and Vomo (**1 hour 10**). Nacula is **4 hours 15** to **4 hours 30** from Denarau.",
        },
        {
          icon: "ticket",
          title: "Pack light for the Flyer",
          text: "The limits are **7 kg** carry-on and **25 kg** for the main bag.",
        },
        {
          icon: "car",
          title: "Allow 6 to 7 hours from Nacula",
          text: "The boat back reaches Denarau about **18:00**, then Sigatoka is **1 hour 15** by road. Plan a full day.",
        },
        {
          icon: "car",
          title: "Use yellow-plate taxis and minibuses",
          text: "Only these are licensed. Avoid road travel outside urban areas at night.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Mamanuca islands",
          tips: [
            {
              title: "Stay at a resort the Flyer serves",
              text: "Not every Mamanuca resort is a Flyer stop. South Sea Island and Vomo are.",
            },
            {
              title: "Join Cloud 9 from Port Denarau",
              text: "The boat leaves at about **09:00** and returns about **15:00**. A **13:00** sailing needs 25 guests. Check what the price includes before you book.",
            },
          ],
        },
        {
          place: "Yasawa islands",
          tips: [
            {
              title: "Swim with mantas when the resort calls",
              text: "Rays come at high tide, not on a timetable. Keep **3 m** away. Do not book a fixed 08:00 slot.",
            },
            {
              title: "Ask the resort about Sawa-i-Lau caves",
              text: "Resorts charge a fee that includes the boat. At low tide you can swim under to a second cave.",
            },
          ],
        },
        {
          place: "Pacific Harbour",
          tips: [
            {
              title: "Leave 18 hours between diving and flying",
              text: "A morning dive on the shark dive day is fine for a **12:00** flight the next day.",
            },
            {
              title: "Leave by 06:00 for the airport",
              text: "The drive to Nadi is about **2 hours 20** to **2 hours 30**. Or add a night near Nadi airport.",
            },
          ],
        },
      ],
    },
    {
      stage: "Staying well",
      tips: [
        {
          icon: "drop",
          title: "Swim where it is safe",
          text: "Rip tides run at reef gaps and river mouths. Swim at lifeguarded beaches or follow local advice.",
        },
        {
          icon: "health",
          title: "Use repellent at dawn and dusk",
          text: "Mosquitoes in Fiji can spread dengue, Zika and chikungunya. Take small cups of kava; large amounts can harm the liver.",
        },
        {
          icon: "weather",
          title: "Keep a spare day before your flight home",
          text: "Boats stop in rough seas.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Cover shoulders and knees in villages",
          text: "Take hats off and ask before photos. Give kava root to the chief, a gift called sevusevu.",
        },
        {
          icon: "chat",
          title: "Say bula and vinaka",
          text: "They mean hello and thank you.",
        },
        {
          icon: "shield",
          title: "Keep clothes on in public",
          text: "Topless bathing and nudity in public are illegal.",
        },
      ],
    },
  ],
};
