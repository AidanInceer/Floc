import type { TripKnow } from "../../know-types";

export const MEXICO_YUCATAN_LOOP: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Mexico", slug: "mexico" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "plane",
          title: "Book a flight home after 16:00",
          text: "Bacalar to Cancún airport takes **4h to 4h 30** by road. A morning flight is out of reach unless you leave at **05:00**, or sleep near the airport the last night.",
        },
        {
          icon: "pin",
          title: "Put the Mérida day on a Sunday",
          text: "On Sunday the streets round the main square close to cars, with bands in the afternoon and a bike route from **08:00 to 12:00**.",
        },
        {
          icon: "weather",
          title: "Go between December and April",
          text: "These are the drier months. Hurricane season runs from June to November.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "money",
          title: "Pay the Quintana Roo visitor tax online",
          text: "The state charges every foreign visitor, children too: about **285 pesos** in 2026. Keep the receipt code to show at the airport when you leave. Airport kiosks charge more, so pay online first.",
          link: { label: "Pay the visitor tax", href: "https://www.visitax.gob.mx" },
        },
        {
          icon: "passport",
          title: "Check your passport lasts the whole stay",
          text: "UK passports need no visa for tourists. The Mexican Embassy suggests a passport valid for **180 days**. You may be asked for a return ticket.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Use authorised airport taxis",
          text: "Taxi drivers' protests have blocked roads near Cancún hotels, and some visitors missed flights. Pick a prepaid airport taxi, not a tout.",
        },
        {
          icon: "train",
          title: "Take the Maya Train to Tulum",
          text: "From Cancún airport it takes **1h 40 to 2h**, with about three trains a day. Check which Tulum station your train uses.",
          link: { label: "Maya Train timetable", href: "https://trenmaya.gob.mx" },
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry pesos in cash",
          text: "Many cenotes take cash only. Gran Cenote asks **300 pesos**. Tulum ruins take cash or card.",
        },
        {
          icon: "ticket",
          title: "Budget for the ruins",
          text: "Chichén Itzá costs about **675 to 700 pesos** for foreign adults in 2026. Uxmal costs about **600 pesos**.",
        },
        {
          icon: "ticket",
          title: "Ask the Tulum ruins price at the gate",
          text: "The price for foreigners is about **625 pesos**, and a cut to about **265 pesos** is expected, with no start date. Check at the gate.",
          temporary: "Until the new Tulum price starts",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Use toll roads and lock your doors",
          text: "The UK government advises toll roads (called cuotas). Keep doors locked and windows up at traffic lights.",
        },
        {
          icon: "moon",
          title: "Avoid driving after dark in remote areas",
          text: "Unofficial roadblocks can appear on quiet roads.",
        },
        {
          icon: "shield",
          title: "Check third-party insurance on your hire quote",
          text: "Ask what the quote covers before you pick the car up.",
        },
        {
          icon: "car",
          title: "Allow 5 hours from Mérida to Bacalar",
          text: "Villages have hard speed bumps, called topes, so slow down. Allow about **5h** for the drive.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Tulum",
          tips: [
            {
              title: "See the ruins first, then a cenote",
              text: "The ruins open at **08:00**, with last entry at **15:30**. Gran Cenote is open **09:00 to 17:00**, so go at about **11:00**.",
            },
            {
              title: "Check the turtle rules at Akumal",
              text: "Akumal is about **30 km** north. Rules can change, so ask on the day. Never touch the turtles.",
            },
          ],
        },
        {
          place: "Valladolid",
          tips: [
            {
              title: "Leave by 07:00 for Chichén Itzá",
              text: "It is **45 min** away and has opened at **08:00** and closed at **16:00** since 1 June 2026. Enter through the new visitor centre: one ticket, one queue.",
            },
            {
              title: "Visit Ik Kil straight after the ruins",
              text: "The cenote is about **3 km** from the site. Go at about **11:00**, not later in the day.",
            },
          ],
        },
        {
          place: "Mérida",
          tips: [
            {
              title: "Do Uxmal on a Saturday or Monday",
              text: "It is about **80 km** away, **1h to 1h 30** by road. Check opening hours first.",
            },
          ],
        },
        {
          place: "Bacalar",
          tips: [
            {
              title: "Skip Wednesday for lagoon trips",
              text: "Lagoon activities are shut on Wednesdays.",
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
          title: "Drink bottled or boiled water",
          text: "Avoid ice. The UK government lists dengue and Zika, so use repellent.",
        },
        {
          icon: "health",
          title: "Expect to pay first at some hospitals",
          text: "Some do not bill insurers directly. You pay, then claim later.",
        },
        {
          icon: "shield",
          title: "Take care after dark in downtown Cancún",
          text: "The UK government notes gang clashes there and in nearby areas, and assaults on British travellers. Stay in lit tourist areas in Tulum and Cancún.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Rinse off sun cream before cenote swims",
          text: "Some sites ask for it, or for biodegradable cream.",
        },
        {
          icon: "customs",
          title: "Leave El Castillo unclimbed",
          text: "Climbing is banned at Chichén Itzá.",
        },
      ],
    },
  ],
};
