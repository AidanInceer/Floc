import type { TripKnow } from "../../know-types";

export const ATACAMA_UNDER_THE_STARS: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Chile", slug: "chile" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "moon",
          title: "Pick a week near the new moon",
          text: "A full moon washes out the stars. Check the moon phase before you book star tours.",
        },
        {
          icon: "ticket",
          title: "Book El Tatio and star tours early",
          text: "Same-day places are not guaranteed.",
        },
        {
          icon: "walk",
          title: "Do El Tatio on day 2 or 3",
          text: "San Pedro is at about **2,400 m** and the geysers are at **4,320 m**. Do not go on arrival day.",
        },
        {
          icon: "drop",
          title: "Float in Laguna Piedra, not Laguna Cejar",
          text: "Swimming is forbidden in Cejar. Floating is allowed only in Piedra, with no sun cream in the water. One operator runs the tour daily except Tuesdays.",
        },
        {
          icon: "moon",
          title: "Choose a small star group",
          text: "Pick a guide who explains the sky, not a large bus. Ask if the price includes a telescope and photos.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Keep your white tourist card",
          text: "UK passports need no visa for up to **90 days**. Hand the card in when you leave. The passport must be valid beyond your departure date.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly to Calama and book a shuttle",
          text: "Flights usually go through Santiago. San Pedro is about **100 km** away: **1h 15 to 1h 30** by shared shuttle, **2 to 3 hours** door to door. Shuttles meet flights from about **06:30 to 21:00**. Later flights need a taxi or a booked transfer.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry cash for park fees",
          text: "Valle de la Luna is **11,000 Chilean pesos**, cash only. The Tebinquinche lagoon is **6,000**, in cash.",
        },
        {
          icon: "ticket",
          title: "Budget for El Tatio entry",
          text: "It is about **15,000 Chilean pesos**; check before you go. Tour prices are separate; ask each operator about cards.",
        },
        {
          icon: "ticket",
          title: "Add the Death Valley entry to sandboarding",
          text: "The fee is **6,000 Chilean pesos** extra. The tour lasts **4 hours** and the minimum age is **12**.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "walk",
          title: "Walk round San Pedro, tour the rest",
          text: "The town is small and walkable. The geysers, lagoons and Valle de la Luna all need a tour or a hired car.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "San Pedro de Atacama",
          tips: [
            {
              title: "Be ready for the El Tatio pickup",
              text: "Pickup is about **04:30 to 05:00**, and the trip takes about **7 hours**. Breakfast is often included.",
            },
            {
              title: "Time Valle de la Luna for sunset",
              text: "Tours leave at **14:30** in winter or **16:00** in summer and return after dark. The Ckari viewpoint is closed until further notice, so guides use another spot.",
              temporary: "Until the Ckari viewpoint reopens",
            },
            {
              title: "Sandboard in Death Valley",
              text: "It is sold in the Valle de la Muerte. You climb back up with the board after every run.",
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
          title: "Drink water all day",
          text: "The air is very dry. Use bottled water.",
        },
        {
          icon: "sun",
          title: "Wear sun cream and a hat all year",
          text: "The sun is very strong here. Put sun cream on at **10:00** and again at **15:00**.",
        },
        {
          icon: "weather",
          title: "Wear a hat and gloves at El Tatio",
          text: "Dawn is below freezing most of the year. Days are warm and nights are cold, so dress in layers.",
        },
        {
          icon: "walk",
          title: "Stay on the marked paths at the geysers",
          text: "The water is near boiling, and the ground can be thin over vents.",
        },
      ],
    },
  ],
};
