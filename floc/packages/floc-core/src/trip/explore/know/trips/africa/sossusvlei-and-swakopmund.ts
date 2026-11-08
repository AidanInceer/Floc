import type { TripKnow } from "../../know-types";

export const SOSSUSVLEI_AND_SWAKOPMUND: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Namibia", slug: "namibia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "pin",
          title: "Sleep inside the park gate",
          text: "Only guests at Sesriem Campsite or Sossus Dune Lodge get in before sunrise, for the dunes in first light.",
        },
        {
          icon: "car",
          title: "Check your car hire cover",
          text: "Many policies exclude a crash on gravel with no other car involved. Add cover for sandboarding too.",
        },
        {
          icon: "weather",
          title: "Go between May and September",
          text: "These are the cooler months. Summer days pass **40°C**.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get a visa",
          text: "UK passports need one since 1 April 2025: **N$1,600** (Namibian dollars), on arrival or online.",
          link: { label: "Apply online", href: "https://eservices.mhaiss.gov.na/visaonarrival" },
        },
        {
          icon: "passport",
          title: "Check your passport has 6 months left",
          text: "It needs **6 months** left after you arrive, and **3** blank pages.",
        },
        {
          icon: "car",
          title: "Pack your driving licence",
          text: "Carry your UK photocard licence.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly into Windhoek",
          text: "Hosea Kutako airport. Sesriem is **300 km** away, mostly on gravel: **4h to 5h** plus stops.",
        },
        {
          icon: "fuel",
          title: "Fill the tank in Windhoek",
          text: "The next fuel is at Solitaire.",
        },
        {
          icon: "shield",
          title: "Do not hail taxis in the street",
          text: "The UK government advises against it in Windhoek. Muggings in the city centre can be violent."
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "ticket",
          title: "Pay the park fee at the gate",
          text: "**N$280** (Namibian dollars) a day per adult from 1 April 2026, plus a car fee of about **N$50 to N$60**. Check at the gate.",
        },
        {
          icon: "money",
          title: "Carry cash",
          text: "For small lodges, fuel and tips.",
        },
        {
          icon: "lock",
          title: "Keep your card in sight",
          text: "Card copying happens at some lodges.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "moon",
          title: "Drive only in daylight",
          text: "Cattle and wild animals use the roads.",
        },
        {
          icon: "car",
          title: "Leave Sesriem by 08:00",
          text: "Swakopmund is about **330 km**, almost all gravel: allow **5h 30** or more with stops.",
        },
        {
          icon: "fuel",
          title: "Fill up at Solitaire",
          text: "There is no fuel on the C14 road until Walvis Bay.",
        },
        {
          icon: "lock",
          title: "Lock the car at fuel stops",
          text: "Thieves work service stations and busy junctions.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Sesriem",
          tips: [
            {
              title: "Take the shuttle to Deadvlei",
              text: "You cannot drive the last **5 km** of deep sand. Park at the car park for normal cars, then walk or ride the authorised shuttle. Confirm with your camp.",
            },
            {
              title: "Ask your camp for the gate times",
              text: "The park gate opens at sunrise. The inner gate opens **1 hour** before sunrise, for guests of the campsite and the lodge only. Times shift each month.",
            },
            {
              title: "Leave the drone at home",
              text: "Drones are not allowed in the park.",
            },
          ],
        },
        {
          place: "Swakopmund",
          tips: [
            {
              title: "Pack a jacket",
              text: "The coast is cool and often foggy.",
            },
            {
              title: "Get a permit for Welwitschia Drive",
              text: "The drive needs a permit. Ask your lodge or check before you go.",
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
          title: "Carry 5 litres of water each day",
          text: "Water is only at the camps.",
        },
        {
          icon: "sun",
          title: "Be off the dunes by 10:00 in summer",
          text: "The sand and the air get dangerously hot.",
        },
        {
          icon: "moon",
          title: "Pack for cold nights",
          text: "Winter nights at Sesriem get near freezing.",
        },
      ],
    },
  ],
};
