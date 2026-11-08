import type { TripKnow } from "../../know-types";

export const NEW_ZEALAND_NORTH_ISLAND: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "New Zealand", slug: "new-zealand" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Book Waitomo, Waitangi and Zealandia early",
          text: "Book the Waitomo caves, Waitangi and the Zealandia night tour ahead for December to February.",
        },
        {
          icon: "weather",
          title: "Travel from November to April",
          text: "May to October is winter on the mountain, with snow and ice.",
        },
        {
          icon: "walk",
          title: "Expect a hard day on the crossing",
          text: "The Tongariro Alpine Crossing is **19.4 km** with about **1,200 m** up and down. Allow **7 to 8 hours** in summer and **9 hours** in winter.",
          link: { label: "Read the crossing page", href: "https://www.doc.govt.nz/parks-and-recreation/places-to-go/central-north-island/places/tongariro-national-park/things-to-do/tracks/tongariro-alpine-crossing/" },
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
          text: "The international visitor levy is **100 New Zealand dollars**. You can stay up to **6 months**.",
        },
        {
          icon: "passport",
          title: "Check your passport",
          text: "It must last **3 months** past the day you leave.",
        },
        {
          icon: "customs",
          title: "Fill in the free traveller declaration",
          text: "File it no earlier than **24 hours** before your flight.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Keep the first day light",
          text: "Flights from the UK change planes in Asia or the Gulf. Do not plan a hard schedule for the day you land in Auckland.",
        },
        {
          icon: "customs",
          title: "Declare food, wood, leather and used outdoor gear",
          text: "Fines go up to **100,000 New Zealand dollars**.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Pay by card",
          text: "Cards work almost everywhere. Wai-O-Tapu takes no cash.",
        },
        {
          icon: "ticket",
          title: "Budget for overseas visitor prices",
          text: "Waitangi costs **78 New Zealand dollars** from 1 October 2026 and the ticket lasts 2 days. Te Papa costs **35 New Zealand dollars** for ages 16 and over, valid **48 hours**.",
          link: { label: "See Waitangi prices", href: "https://www.waitangi.org.nz/book/waitangi-admissions" },
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire a car and drive on the left",
          text: "A UK photocard licence is valid for up to **18 months**. Roads are narrow, winding and hilly, so add time for stops.",
        },
        {
          icon: "car",
          title: "Ask about the one-way hire fee",
          text: "If you leave the car in Wellington instead of Auckland, there is a fee. Ask before you book.",
        },
        {
          icon: "car",
          title: "Visit Waitomo on the drive south",
          text: "Rotorua to Waitomo to National Park village saves about **4 hours** of driving back and forth. This route skips Taupō, so drop Huka Falls from that day.",
        },
        {
          icon: "lock",
          title: "Leave nothing in the car",
          text: "Thieves target hire cars.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Auckland",
          tips: [
            {
              title: "Go up the Sky Tower late in summer",
              text: "Sunset in December and January is about **20:40**, not 17:00.",
            },
          ],
        },
        {
          place: "Bay of Islands",
          tips: [
            {
              title: "Book the Hole in the Rock cruise early",
              text: "The cruise takes about **4.5 to 5 hours**. It cancels in swell, so keep a day loose and use Russell as the fallback.",
            },
            {
              title: "Use both days of the Waitangi ticket",
              text: "It covers the tour, the cultural show and two museums.",
            },
          ],
        },
        {
          place: "Coromandel",
          tips: [
            {
              title: "Look up the low tide first",
              text: "Hot Water Beach works about **2 hours** either side of low tide, and low tide moves each day. Fit Cathedral Cove around it.",
            },
            {
              title: "Check alerts before Cathedral Cove",
              text: "The Cove track is open but closes at short notice and in orange or red weather warnings. The Hahei Short Walk and Gemstone Bay track are closed.",
              link: { label: "See the Cathedral Cove updates", href: "https://www.doc.govt.nz/news/issues/cathedral-cove-and-hahei-updates/" },
              temporary: "Until the walk is repaired",
            },
          ],
        },
        {
          place: "Rotorua",
          tips: [
            {
              title: "Arrive at Wai-O-Tapu by 09:45",
              text: "The Lady Knox geyser goes off at **10:15** daily. The park opens at **08:30** and last entry is **15:00**.",
            },
            {
              title: "Choose a cultural village or evening show",
              text: "Whakarewarewa runs daily guided tours and shows. Ask the venue first if you want a hāngī, a meal cooked in the ground.",
            },
          ],
        },
        {
          place: "Tongariro",
          tips: [
            {
              title: "Book a shuttle to the start",
              text: "The shuttle is the one fixed item of the trip, so book it first. There is no summer parking at the Mangatepopo start. The Department of Conservation fee of about **40 New Zealand dollars** is part of the shuttle fare, and operators charge more. Check the alert the night before.",
            },
            {
              title: "Stay on the track",
              text: "The fire-hit land has a ten-year rāhui, a ban on entry.",
            },
          ],
        },
        {
          place: "Wellington",
          tips: [
            {
              title: "Allow 4 hours 30 for the drive back",
              text: "Leave at **09:00** with time for stops. Check in at least **2 hours** before your flight.",
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
          text: "Water on the track is not safe to drink. Carry waterproofs, hat, gloves, sunscreen and a head torch.",
        },
        {
          icon: "health",
          title: "Test hot spring water before you sit",
          text: "Hot spring water at Hot Water Beach can scald. In geothermal areas, stay on the path.",
        },
        {
          icon: "shield",
          title: "Drop, cover and hold in an earthquake",
          text: "Earthquakes happen and some volcanoes are active. If the ground shakes, drop to the floor, take cover under a table and hold on.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Say kia ora",
          text: "It means hello. Take your shoes off at a marae, a Māori meeting house.",
        },
      ],
    },
  ],
};
