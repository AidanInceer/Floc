import type { TripKnow } from "../../know-types";

export const VANUATU_VOLCANO: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Vanuatu", slug: "vanuatu" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "plane",
          title: "Book flexible Tanna flights",
          text: "Flights are few and change at short notice; reconfirm with the airline.",
        },
        {
          icon: "moon",
          title: "Keep a spare night in Port Vila",
          text: "One lost flight removes the volcano night, and the plan ends on a remote island. Do not fly home the day you leave Tanna.",
        },
        {
          icon: "weather",
          title: "Travel from June to October",
          text: "Cyclone season normally runs November to May, so June to October is the safest window.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport and return ticket",
          text: "A UK passport is on the visa-exempt list. The passport must be valid for more than **6 months** after arrival, and you need a return ticket and a confirmed address.",
          link: { label: "Read the entry rules on the Vanuatu immigration site", href: "https://immigration.gov.vu/entry-and-departure-requirements-for-vanuatu/" },
        },
        {
          icon: "shield",
          title: "Buy insurance for volcano closures and evacuation",
          text: "Serious cases go to Australia or New Zealand, so insure for evacuation.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Connect on the way from the UK",
          text: "No direct UK flights run to Port Vila. Connect through Australia, Fiji or New Caledonia.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Bring vatu cash for Tanna",
          text: "Volcano entry and landowner fees are paid in cash. Bring about **10,000 vatu** in cash for the volcano fee, and confirm the amount with your bungalow.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "plane",
          title: "Fly to Tanna on a small plane",
          text: "Port Vila to Tanna takes about **1 hour**.",
        },
        {
          icon: "car",
          title: "Ask your bungalow for a pick-up",
          text: "On Tanna the bungalow arranges the four-wheel-drive pick-up. Many roads are poorly surfaced, and night driving is especially dangerous.",
        },
        {
          icon: "boat",
          title: "Avoid inter-island boats",
          text: "They are infrequent and many lack current sea-worthiness certificates.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Port Vila",
          tips: [
            {
              title: "Swim at the Eton Blue Lagoon",
              text: "Entry is about **500 vatu** for an adult and **300 vatu** for a child, paid in cash to the landowners. The big blue holes are on another island, Espiritu Santo.",
              link: { label: "See the Blue Lagoon guide", href: "https://vanuatu.travel/en/blue-lagoon-guide" },
            },
            {
              title: "Take a taxi at night",
              text: "Violent burglaries and attacks have hit tourists at Port Vila nightclubs and bars. Minibuses cost about **150 vatu** a ride in town.",
            },
          ],
        },
        {
          place: "Tanna",
          tips: [
            {
              title: "Ask your guide if Yasur is open",
              text: "The volcano has been at alert level 2 since 2016. A danger zone of about **600 m** surrounds the vents and bombs can land near the rim. Guides and landowners decide each day.",
              link: { label: "See the volcano alert level", href: "https://www.vmgd.gov.vu/geohazards/volcanoes/yasur" },
            },
            {
              title: "Wear boots, not flip-flops",
              text: "Tours run at dusk. Landowners charge visiting fees off the main track.",
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
          title: "Protect against mosquito bites",
          text: "Mosquitoes can spread malaria, dengue and chikungunya. The risk differs by island, so check the UK travel health site before you go.",
        },
        {
          icon: "health",
          title: "Save the ambulance number 115",
          text: "The number is **115**. Care on the islands is basic.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Cover up away from the beach",
          text: "Do not wear beachwear away from beaches and hotels. Ask before taking photos.",
        },
        {
          icon: "customs",
          title: "Respect nakamals",
          text: "Some nakamals, the kava bars, outside Port Vila do not welcome women.",
        },
        {
          icon: "shield",
          title: "Avoid all drugs",
          text: "Even small amounts can mean prison and a large fine.",
        },
        {
          icon: "food",
          title: "Buy alcohol before Saturday midday",
          text: "Supermarkets cannot sell alcohol from midday Saturday to **07:00** Monday. Bars and hotels can.",
        },
      ],
    },
  ],
};
