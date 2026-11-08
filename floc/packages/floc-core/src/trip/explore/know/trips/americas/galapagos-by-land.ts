import type { TripKnow } from "../../know-types";

export const GALAPAGOS_BY_LAND: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Ecuador", slug: "ecuador" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "plane",
          title: "Plan the way back to the airport",
          text: "Tourist flights leave from Baltra on Santa Cruz or from San Cristóbal. Take the morning boat back from Isabela and a flight after midday. Do not plan the last day on Isabela.",
        },
        {
          icon: "lock",
          title: "Buy travel health insurance",
          text: "The UK government says it is mandatory for foreign tourists, though checks vary. Choose cover that includes air evacuation.",
        },
        {
          icon: "weather",
          title: "Choose warm or cool season",
          text: "December to May is warm, with heavy showers. June to November is cooler, with drizzle and colder water. Tortoises in the highlands show up all year.",
        },
        {
          icon: "ticket",
          title: "Book boats and guided days ahead",
          text: "Do this in the warm season. Choose a guide with small groups.",
        },
        {
          icon: "weather",
          title: "Check the UK advice and airline before flying",
          text: "Weather and floods can disrupt flights and roads. Read the UK government page for Ecuador the week you go.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "shield",
          title: "Connect through Quito, not Guayaquil",
          text: "The UK government advises against all but essential travel to Guayaquil, except airside transit. If you connect there, stay airside.",
        },
        {
          icon: "passport",
          title: "Get the transit control card before check-in",
          text: "It costs **US$20**. Pay by card on the Galápagos government's portal, or buy it at the Quito or Guayaquil airport counter. Check which your airline wants, and keep the card for the flight home.",
        },
        {
          icon: "passport",
          title: "Carry hotel proof and a return flight",
          text: "You need a hotel booking or a host letter, and a flight back to the mainland. Stay up to **60 days** on the islands. Your passport must be valid **6 months** after arrival.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly Quito to Baltra",
          text: "From the airport, a bus, a canal ferry and a bus or taxi take about **90 minutes** to Puerto Ayora. Bus and ferry cost about **US$5 to 6**.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Pay the park fee in cash",
          text: "It is about **US$200** for adults and **US$100** for children under 12, in cash at the Baltra or San Cristóbal counter. Cards are refused.",
        },
        {
          icon: "money",
          title: "Carry clean US dollar notes",
          text: "Ecuador uses the US dollar. Torn or marked notes are refused. Bring extra cash for Isabela.",
        },
        {
          icon: "money",
          title: "Budget about US$220 each before anything else",
          text: "That is the park fee plus the **US$20** transit card.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "boat",
          title: "Take the fast boat to Isabela",
          text: "It takes about **2h** and costs about **US$35 to 40**. Boats usually leave Santa Cruz at **07:00** and **15:00**, and Isabela at **06:00** and **15:00**. Rough seas cancel them.",
        },
        {
          icon: "car",
          title: "Allow 1h 30 from Santa Cruz to Baltra",
          text: "It is a bus, a canal ferry and a bus.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Santa Cruz",
          tips: [
            {
              title: "Book North Seymour with a licensed guide",
              text: "Day boats leave from Puerto Ayora.",
            },
          ],
        },
        {
          place: "Isabela",
          tips: [
            {
              title: "Snorkel Los Túneles by boat",
              text: "Boats leave from Puerto Villamil.",
            },
            {
              title: "Bring a first-aid kit",
              text: "Medical care here is basic. Air-ambulance cover matters.",
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
          title: "Pack filtered water, seasickness tablets and sun cream",
          text: "Drink bottled or filtered water. The sun at the equator is strong.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "walk",
          title: "Follow your licensed guide at visitor sites",
          text: "Groups are small and visits last **2 to 4 hours**. Do not touch or feed animals, and keep **2 m** away.",
        },
      ],
    },
  ],
};
