import type { TripKnow } from "../../know-types";

export const DAKAR_AND_SALOUM: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Senegal", slug: "senegal" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go between December and April",
          text: "These are the dry months. Rains fall from May to November.",
        },
        {
          icon: "car",
          title: "Ask your lodge how long the drive is",
          text: "The delta is **2h 10** from Dakar at Palmarin and **3h 15** at Toubacouta, before traffic. Allow **3h 30** and leave Dakar before 07:00.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport",
          text: "UK passports need no visa for up to **3 months**. The passport must be valid for **6 months**.",
        },
        {
          icon: "passport",
          title: "Keep proof of onward travel",
          text: "You may be asked for an onward ticket and a booked address at the border.",
        },
        {
          icon: "health",
          title: "Carry a yellow fever certificate if needed",
          text: "It is only required if you arrive from a risk country. Ask a travel clinic about malaria.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Expect a long ride from Blaise Diagne airport",
          text: "The airport is **43 km** east of Dakar. A train to the airport opened on 28 September 2026 and takes about **55 min** from central Dakar: check the fare.",
        },
        {
          icon: "shield",
          title: "Pre-book your taxi and check the driver's name",
          text: "Fake drivers pretend to know you at the airport, and con artists wait near the baggage carousel. Do not change money there.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Draw cash in Dakar",
          text: "Cash machines are rare in the delta and cards rarely work. The currency is the West African franc.",
        },
        {
          icon: "money",
          title: "Break big notes early",
          text: "Drivers lack change for **5,000** and **10,000** franc notes. Fake notes are a risk when you change cash, so use a cash machine or a licensed exchange office.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Agree taxi fares before you get in",
          text: "Ride apps such as Yango and Heetch work in Dakar.",
        },
        {
          icon: "car",
          title: "Take the Rufisque toll road at peak times",
          text: "It costs **400 francs** and can save up to **2h**.",
        },
        {
          icon: "moon",
          title: "Carry your licence if you drive",
          text: "A UK licence is valid for **6 months**. A 1968 international driving permit can help with officials. Avoid driving at night.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Dakar",
          tips: [
            {
              title: "Check the last boat back from Gorée",
              text: "Check the last sailing; often only one ferry runs. Return fare about **5,200 francs** plus about **500 francs** tourist tax. Bring photo identity.",
            },
            {
              title: "Check opening nights before a live music club",
              text: "Club Thiossane and Just 4 U are named for world music.",
            },
          ],
        },
        {
          place: "Saloum delta",
          tips: [
            {
              title: "Agree the price before boarding a pirogue",
              text: "A pirogue is a local boat. Dawn trips show royal terns, flamingos and spoonbills.",
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
          title: "Insure for medical evacuation",
          text: "Care outside Dakar is limited. The UK government lists dengue, Zika, yellow fever and diphtheria.",
        },
        {
          icon: "shield",
          title: "Avoid walking alone after dark",
          text: "Hotels popular with foreigners have been robbed. Protests in Dakar can block the airport road. Take care in border areas near Mali.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Greet before you ask anything",
          text: "Say Salaam aleikum; the reply is Waleikum salaam. French and Wolof are spoken. Not greeting is rude.",
        },
      ],
    },
  ],
};
