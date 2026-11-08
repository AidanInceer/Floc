import type { TripKnow } from "../../know-types";

export const ROTORUA_AND_TAUPO: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "New Zealand", slug: "new-zealand" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "walk",
          title: "Keep the crossing for a fit day",
          text: "The Tongariro Alpine Crossing is **19.4 km** with about **1,200 m** up and the same down. Allow **7 to 9 hours**. It is not for children under 10.",
          link: { label: "Read the crossing page", href: "https://www.doc.govt.nz/parks-and-recreation/places-to-go/central-north-island/places/tongariro-national-park/things-to-do/tracks/tongariro-alpine-crossing/" },
        },
        {
          icon: "weather",
          title: "Travel from November to April",
          text: "May to October is winter on the mountain.",
        },
        {
          icon: "ticket",
          title: "Book the shuttle and evening shows",
          text: "Book the crossing shuttle and the cultural evening shows ahead. The booking with the Department of Conservation is free.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Apply for the travel authorisation",
          text: "A UK passport needs a New Zealand electronic travel authorisation: **17 New Zealand dollars** in the app or **23 New Zealand dollars** online. Allow **72 hours**.",
          link: { label: "Apply on the Immigration New Zealand site", href: "https://www.immigration.govt.nz/new-zealand-visas/visas/visa/nzeta" },
        },
        {
          icon: "money",
          title: "Pay the visitor levy with it",
          text: "The international visitor levy is **100 New Zealand dollars**. You can stay for **6 months**.",
        },
        {
          icon: "passport",
          title: "Check your passport",
          text: "It must last **3 months** past the day you leave.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Drive from Auckland to Rotorua",
          text: "Fly to Auckland, then drive to Rotorua, about **3 hours**.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Pay by card at Wai-O-Tapu",
          text: "The park takes no cash.",
        },
        {
          icon: "ticket",
          title: "Budget for the village tour",
          text: "A Whakarewarewa guided tour is **55 New Zealand dollars** for an adult and the self-guided trails are **42 New Zealand dollars**. The Redwoods night walk is about **45 to 55 New Zealand dollars**.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire a car and drive on the left",
          text: "Rotorua to Taupō is about **78 to 80 km**, about **1 hour**. A UK photocard licence is valid for up to **18 months**.",
        },
        {
          icon: "car",
          title: "Join the crossing shuttle in four towns",
          text: "Taupō is **86.5 km** from the track. Shuttles run from Taupō, Tūrangi, National Park and Ohakune. Never park on the state highway.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Rotorua",
          tips: [
            {
              title: "Arrive at Wai-O-Tapu by 09:45",
              text: "The Lady Knox geyser goes off at **10:15**. The park opens at **08:30**, last entry is **15:00**, and it is closed on Christmas Day.",
            },
            {
              title: "Join a guide at Whakarewarewa",
              text: "You cannot enter without a guide. Tours run **09:00 to 15:00** and the village is closed on 24 and 25 December. Ask the venue first if you want a hāngī, a meal cooked in the ground.",
            },
          ],
        },
        {
          place: "Taupō",
          tips: [
            {
              title: "Do not drive to the crossing start",
              text: "There is no summer parking at the Mangatepopo start. The Department of Conservation shuttle fee is about **40 New Zealand dollars**, and operators charge more. Ask the operator about road access.",
            },
            {
              title: "Check the mountain alert the night before",
              text: "The Department of Conservation issues a \"Not Recommended Today\" notice in bad weather. Taranaki Falls track is the bad-weather walk it names.",
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
          title: "Carry 2 to 3 litres of water",
          text: "Water on the track is not safe to drink. Take a head torch, hat and gloves.",
        },
        {
          icon: "shield",
          title: "Stay on the marked track",
          text: "Burnt land near the start has a ten-year rāhui, a ban on entry. Red Crater has loose rock.",
        },
        {
          icon: "health",
          title: "Keep away from steam vents and lakes",
          text: "Stay on the paths in hot areas. The volcanoes are active, and eruptions are unlikely but possible.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Say kia ora",
          text: "It means hello. Take your shoes off at a marae, a Māori meeting house, and ask before you film.",
        },
      ],
    },
  ],
};
