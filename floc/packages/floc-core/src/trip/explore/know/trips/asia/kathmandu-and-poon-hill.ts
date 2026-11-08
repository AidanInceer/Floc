import type { TripKnow } from "../../know-types";

export const KATHMANDU_AND_POON_HILL: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Nepal", slug: "nepal" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "walk",
          title: "Plan the walk out and the way home",
          text: "The route ends at Ghorepani. The descent to Nayapul is **11 km**, about **4.5 hours** of stone steps, then a drive to Pokhara and a flight to Kathmandu.",
        },
        {
          icon: "weather",
          title: "Go in October, November, March or April",
          text: "December to February brings freezing nights at Ghorepani and snow on the upper stairs. Spring brings rhododendron bloom.",
        },
        {
          icon: "ticket",
          title: "Book a guide and teahouse beds early",
          text: "October and November are the peak. Dashain and Tihar close shops and offices and fill transport; the dates move each year, so ask your agency.",
        },
        {
          icon: "walk",
          title: "Use a local guide or porter",
          text: "The UK government says independent trekkers in protected areas must hire a local guide or porter, or risk fines or removal. Hire one through a registered agency.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Apply for the visa online",
          text: "UK passports get a visa on arrival, with the online form up to **15 days** before. Your passport needs **6 months** left after entry.",
          link: { label: "Check fees at immigration.gov.np", href: "https://immigration.gov.np" },
        },
        {
          icon: "money",
          title: "Carry US dollars for the visa",
          text: "Fees are about **US$30** for 15 days, **US$50** for 30 days and **US$125** for 90 days. Pay in cash.",
        },
        {
          icon: "shield",
          title: "Take insurance that covers helicopter rescue",
          text: "It must include mountain rescue and helicopter costs.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Check your flight route",
          text: "The UK government notes Middle East airspace disruption.",
          temporary: "Until the airspace closures end",
        },
        {
          icon: "car",
          title: "Use the prepaid taxi counter",
          text: "It is at arrivals in Kathmandu.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "ticket",
          title: "Buy permits through your agency",
          text: "The Annapurna Conservation Area permit is **3,000 Nepalese rupees**, doubled at a checkpost. The UK government says a trekkers' information card is also needed. Ask your agency which permits you need.",
        },
        {
          icon: "money",
          title: "Draw cash in Pokhara",
          text: "Cash machines charge at least **500 Nepalese rupees** a withdrawal, and the trail has none.",
        },
        {
          icon: "money",
          title: "Carry small notes for teahouses",
          text: "Teahouse rooms are cheap, and dinner and breakfast at your lodge is the custom.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "plane",
          title: "Fly to Pokhara in the morning",
          text: "The flight takes **25 to 30 minutes** but weather cancels flights often. Keep a spare day; the tourist bus takes **6 to 8 hours**.",
        },
        {
          icon: "car",
          title: "Ask your agency about the jeep",
          text: "Jeeps run from Pokhara to Nayapul or Ulleri, then you walk about **3 to 5 hours** to Ghorepani.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Kathmandu",
          tips: [
            {
              title: "Visit Bhaktapur as a half day",
              text: "It is **40 to 60 minutes** by bus, so it is tight on a two-night stay.",
            },
          ],
        },
        {
          place: "Pokhara",
          tips: [
            {
              title: "Book flights home ahead",
              text: "Kathmandu to Pokhara flights fill up.",
            },
          ],
        },
        {
          place: "Ghorepani",
          tips: [
            {
              title: "Climb Poon Hill before dawn",
              text: "Ghorepani is at **2,860 m**, and the hill is **3,210 m**. Go slowly; do not rush the steps.",
            },
            {
              title: "Pack a head torch",
              text: "The climb starts in the dark, so ask your lodge for the timing.",
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
          title: "Stop and rest if you feel ill",
          text: "Altitude headaches, dehydration and stomach upsets are common. Drink **3 litres** a day.",
        },
        {
          icon: "shield",
          title: "Avoid cheap trek deals",
          text: "The UK government reports guides who hurry clients high, then call paid helicopters.",
        },
        {
          icon: "weather",
          title: "Check roads for floods and landslides",
          text: "The monsoon runs about June to September, and floods can cut roads.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Walk clockwise round stupas",
          text: "Do not point your feet at a person.",
        },
        {
          icon: "chat",
          title: "Say namaste",
          text: "It is the usual greeting.",
        },
      ],
    },
  ],
};
