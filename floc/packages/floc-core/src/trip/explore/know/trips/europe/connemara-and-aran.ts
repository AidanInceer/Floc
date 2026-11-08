import type { TripKnow } from "../../know-types";

export const CONNEMARA_AND_ARAN: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Ireland", slug: "ireland" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "boat",
          title: "Pre-book the ferry and the Galway shuttle",
          text: "The shuttle needs booking at least **12 hours** ahead.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Carry your passport",
          text: "UK citizens do not legally need one to enter Ireland, but some airlines and ferry firms now ask to see photo identity. Ireland is outside the Schengen area, so the EU's new Entry/Exit System does not apply.",
          link: { label: "UK entry rules for Ireland", href: "https://www.gov.uk/foreign-travel-advice/ireland/entry-requirements" },
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly to Dublin or Shannon for Galway",
          text: "Check the onward times before you book your flights.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "ticket",
          title: "Budget €5 for Dún Aonghasa",
          text: "Entry is **€5** for an adult. It is free if you stay in island accommodation that takes part.",
        },
        {
          icon: "ticket",
          title: "Budget €34 for the ferry",
          text: "An adult return from Rossaveel is **€34**. The Galway shuttle is **€10** return.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "boat",
          title: "Allow about 2h from Galway to Inis Mór",
          text: "The shuttle leaves from Victoria Place; be there **20 min** before. The Rossaveel ferry then takes **40 min** and sails all year. A seasonal 09:30 sailing leaves from Galway city and takes **90 min**.",
        },
        {
          icon: "boat",
          title: "Check the last sailing back",
          text: "Plan the day around it. Keep a spare day before any flight home.",
        },
        {
          icon: "walk",
          title: "Take a bike for the island",
          text: "A bike on the ferry is **€15** return, booked ahead. No electric bikes, and nothing over **20 kg**. The shuttle cannot carry bikes. Minibuses and pony traps also run in summer.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Galway",
          tips: [
            {
              title: "Ask for the session time at Tig Cóilí",
              text: "It is on Mainguard Street and has traditional music sessions daily. Ask for the session time on the day.",
            },
          ],
        },
        {
          place: "Inis Mór",
          tips: [
            {
              title: "Stay back from the Dún Aonghasa cliff edge",
              text: "The edge has no fence and drops **87 m**. Wear boots on the rough rock. Drones are not allowed.",
            },
            {
              title: "Get to the fort before it closes",
              text: "It is open **09:30 to 18:00** from April to October, and to **16:00** in winter.",
            },
          ],
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Say \"Dia duit\" for hello",
          text: "Inis Mór is in the Irish-speaking region. The island's own name is Árainn.",
        },
        {
          icon: "weather",
          title: "Plan for wind when you cycle",
          text: "The island roads are flat. The wind is the hard part.",
        },
      ],
    },
  ],
};
