import type { TripKnow } from "../../know-types";

export const HAVANA_AND_VINALES: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Cuba", slug: "cuba" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "shield",
          title: "Read the UK government warning first",
          text: "It advises against all but essential travel to Cuba. The power grid has collapsed several times, fuel is rationed and many flights are suspended. Read the UK government page the week you book.",
        },
        {
          icon: "plane",
          title: "Check your flight with the airline",
          text: "Cuban authorities say all international airports lack aviation fuel, and only Terminal 3 at Havana is open. Canadian airlines, Air France, Iberia and several others have suspended flights. Check when you book and again a week out.",
          temporary: "Until international flights run normally again",
        },
        {
          icon: "lock",
          title: "Check in writing that your insurer covers Cuba",
          text: "Ask before you pay for the trip.",
          link: { label: "Insurance advice for Cuba", href: "https://www.gov.uk/foreign-travel-advice/cuba/warnings-and-insurance" },
        },
        {
          icon: "weather",
          title: "Go between December and April",
          text: "Hurricane season runs from June to November. It can cut power, phone signal and water.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get your tourist visa first",
          text: "You need a tourist visa, also called a tourist card. Apply through the Cuban Embassy in the UK, a travel agent or the online visa service. The passport must be valid **6 months** after you arrive and **3 months** after you leave.",
        },
        {
          icon: "passport",
          title: "Complete the D'Viajeros form",
          text: "Do it within **72 hours** before you arrive. Save the scannable code as a file on your phone, because wifi on arrival may not work. You also need proof of onward travel.",
        },
        {
          icon: "customs",
          title: "Leave drones at home",
          text: "Drones are banned and held until you leave.",
        },
        {
          icon: "customs",
          title: "Turn off location tracking on your devices",
          text: "This covers built-in tracking on phones, tablets and laptops.",
        },
        {
          icon: "customs",
          title: "Declare foreign cash over US$5,000",
          text: "Declare foreign cash worth more than **US$5,000**.",
        },
        {
          icon: "passport",
          title: "Apply for a US visa after visiting Cuba",
          text: "You usually cannot get a US travel permit called an ESTA (Electronic System for Travel Authorization) if you have been in Cuba since **12 January 2021**. You would need a visa instead.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Use a yellow taxi or pre-arranged transport",
          text: "Fake taxi drivers work at the airport and in Old Havana.",
        },
        {
          icon: "walk",
          title: "Download maps and bookings before you land",
          text: "Wifi may not work on arrival, and internet can be blocked at times of unrest.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Bring all your cash for the stay",
          text: "UK Visa and Mastercard cards no longer work, and cash machines do not accept them. Bring spare cash. Euros and US dollars are widely accepted.",
          temporary: "Until UK bank cards work in Cuba again",
        },
        {
          icon: "money",
          title: "Change money only at Cadeca",
          text: "The UK government says changing money anywhere else is illegal.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Arrange Havana to Viñales in advance",
          text: "Allow about **2h 30** as a guide. Fuel is rationed, so do not rely on petrol on the way.",
        },
        {
          icon: "moon",
          title: "Do not drive at night",
          text: "Animals, unlit vehicles, little street lighting and poor signs make it unsafe.",
        },
        {
          icon: "car",
          title: "Avoid private and classic-car taxis",
          text: "Official yellow taxis are generally reliable. Coco-taxis may be unsafe: tourists have been injured and killed.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Havana",
          tips: [
            {
              title: "Watch for pickpockets in Old Havana",
              text: "They work on public transport and in nightclubs too. Take care at night, and leave valuables in a safe with a photocopy of your passport on you.",
            },
            {
              title: "Check venues are open before a night out",
              text: "Power cuts and dark streets mean venues may be shut.",
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
          title: "Carry water and charge your phone",
          text: "Power cuts and water shortages are severe.",
        },
        {
          icon: "shield",
          title: "Stay away from protests and crowds",
          text: "Muggings happen in Havana and opportunistic crime is increasing, so keep away from large gatherings.",
        },
      ],
    },
  ],
};
