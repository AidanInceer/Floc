import type { TripKnow } from "../../know-types";

export const MASAI_MARA_TO_ZANZIBAR: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Kenya", slug: "kenya" },
    { country: "Tanzania", slug: "tanzania" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "plane",
          title: "Allow most of a day for Mara to Serengeti",
          text: "There is no direct flight. Since 1 June 2026 two airlines link them with flights and a border stop at Kisumu or Musoma. Ask your operator to confirm the schedule in writing.",
        },
        {
          icon: "car",
          title: "Stay near the Serengeti airstrip you fly into",
          text: "The drive to Ngorongoro takes **4h** from the central Serengeti but much longer from the north.",
        },
        {
          icon: "ticket",
          title: "Book Mara lodges and balloon places months ahead",
          text: "July to October is high season. Lodges near the river fill first.",
        },
        {
          icon: "weather",
          title: "Pack warm for Ngorongoro rim nights",
          text: "Nights on the rim are cold from May to August. Short rains fall in November.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get Kenya's travel permit and government insurance",
          text: "Kenya needs an electronic travel authorisation (about **US$30**) and, from 5 October 2026, government travel health insurance at **US$44**, bought in the same form. Foreign policies are not accepted.",
        },
        {
          icon: "passport",
          title: "Get Tanzania's e-visa and government insurance",
          text: "Tanzania needs an online visa plus mandatory government inbound insurance at **US$44** from 1 October 2026. One policy covers Zanzibar too. Your own travel policy does not replace it.",
          link: { label: "Buy the Tanzania insurance", href: "https://inbound.nicinsurance.co.tz" },
        },
        {
          icon: "passport",
          title: "Check your passport",
          text: "Kenya wants **6 months** and **2** blank pages. Tanzania wants **6 months** and **1** blank page.",
        },
        {
          icon: "health",
          title: "Carry a yellow fever certificate",
          text: "Kenya is a risk country, so you may be asked for it at the Tanzania legs and the Zanzibar flight.",
        },
        {
          icon: "customs",
          title: "Leave plastic bags at home",
          text: "They are banned in Kenya, including in luggage.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry clean US dollar notes dated after 2003",
          text: "Use them for tips and extras. Park fees are usually in the price.",
        },
        {
          icon: "ticket",
          title: "Pay Ngorongoro fees by prepaid card",
          text: "Fees are **US$70.80** a person a day plus **US$295** a vehicle, on a prepaid park card only. Your operator usually handles it.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "plane",
          title: "Pack in a soft bag",
          text: "Light aircraft limits are about **15 kg**. Ask your operator for the exact figure.",
        },
        {
          icon: "plane",
          title: "Leave Ngorongoro by 07:30 for the Zanzibar flight",
          text: "The drive to Arusha airport is over **3 hours**, so take an afternoon flight, **14:30** or later.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Nairobi",
          tips: [
            {
              title: "Fly to the Mara from Wilson Airport",
              text: "Mara flights leave from Wilson Airport, not the main international airport.",
            },
          ],
        },
        {
          place: "Masai Mara",
          tips: [
            {
              title: "Wait for a possible river crossing",
              text: "Crossings are not on a timetable. The Kenya side is busiest about August to September. Pack lunch and spend the day.",
            },
            {
              title: "Choose a conservancy-run village visit",
              text: "Maasai village visits are often staged, and the money often goes to one group.",
            },
          ],
        },
        {
          place: "Ngorongoro",
          tips: [
            {
              title: "Be at the crater gate at 06:00",
              text: "Gates open at **06:00** and close at **18:00**. The descent road closes at **16:00**.",
            },
          ],
        },
        {
          place: "Stone Town",
          tips: [
            {
              title: "Cover shoulders and knees",
              text: "Fines of **US$700** or more are possible outside resorts. In Ramadan do not eat or drink in public.",
            },
          ],
        },
        {
          place: "Paje",
          tips: [
            {
              title: "Check the tide table before you swim",
              text: "At low tide the sea can be nearly **1 km** out.",
            },
            {
              title: "Book the Mnemba boat from Nungwi or Matemwe",
              text: "Mnemba is off the north-east tip, a long drive from Paje. Marine fees are often in the price.",
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
          title: "Take malaria tablets",
          text: "Ask a travel clinic. Drink bottled water and use sun cream and a hat.",
        },
        {
          icon: "shield",
          title: "Use hotel taxis in Stone Town",
          text: "Bags are snatched in Stone Town and on beaches. Avoid crowds and protests.",
        },
        {
          icon: "car",
          title: "Do not drive in the Serengeti at night",
          text: "Night driving is banned.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Tip the guide and camp staff at the end",
          text: "Ask your operator for the usual amounts.",
        },
        {
          icon: "customs",
          title: "Keep affection private",
          text: "Same-sex acts are illegal in both countries.",
        },
      ],
    },
  ],
};
