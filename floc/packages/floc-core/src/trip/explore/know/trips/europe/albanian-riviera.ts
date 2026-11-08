import type { TripKnow } from "../../know-types";

export const ALBANIAN_RIVIERA: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Albania", slug: "albania" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go in May, June or September",
          text: "Beach season starts in early May. July and August are hot and crowded.",
        },
        {
          icon: "pin",
          title: "Book rooms early for summer",
          text: "Himarë and Dhërmi rooms fill in July and August. Gjirokastër stone-house guesthouses fill for September.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport dates",
          text: "UK passports need no visa for **90 days** in any 180. The passport must be under **10 years** old on arrival and valid for **3 months** after you leave.",
          link: { label: "UK entry rules for Albania", href: "https://www.gov.uk/foreign-travel-advice/albania/entry-requirements" },
        },
        {
          icon: "car",
          title: "Think about a 1968 International Driving Permit",
          text: "The UK government says it may be useful with your UK licence. For your own car you must carry a Green Card. A hire firm supplies the insurance papers.",
        },
        {
          icon: "plane",
          title: "Do not plan on Vlorë airport",
          text: "As of July 2026 no scheduled flights serve it. Fly to Tirana, or to Corfu.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Allow a long drive south from Tirana",
          text: "The road goes over the narrow, winding Llogara pass and takes several hours.",
        },
        {
          icon: "boat",
          title: "Take the Corfu ferry to Sarandë",
          text: "A daily ferry runs in season and takes about **30 to 70 min**. Rental cars from Corfu may not be carried to Albania.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry cash for gates, parking and beach clubs",
          text: "Cards fail often, and every cash machine charges a fee.",
        },
        {
          icon: "money",
          title: "Decline paying in pounds",
          text: "Card machines may offer it. You get a worse rate.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire a car for this trip",
          text: "Minibuses serve the coast, but the last one may not run, especially to Sarandë.",
        },
        {
          icon: "car",
          title: "Avoid driving at night",
          text: "Road surfaces are poor, and roadworks and potholes are often unmarked in the dark. After any crash, stay until the police arrive.",
        },
        {
          icon: "pin",
          title: "Stop at the Blue Eye spring",
          text: "Entry is about **50 lek** in cash and a walk of about **2 km** from the car park. Swimming is not allowed. Allow about **4h** with lunch from Himarë to Gjirokastër.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Himarë",
          tips: [
            {
              title: "Walk down to Gjipe beach early",
              text: "The canyon path is about **2.5 km** and has no shade: **20 to 45 min** down, **30 to 40 min** up. The car park at the top fills by **10:00 to 11:00** in July. Boats run from Himarë or Dhërmi for **€20 to 30**.",
            },
          ],
        },
        {
          place: "Gjirokastër",
          tips: [
            {
              title: "Check the castle closing time when you arrive",
              text: "It may close before dusk. Entry is about **400 lek** in cash, and the armoury museum is about **200 lek** extra.",
            },
            {
              title: "Wear shoes for steep cobbles",
              text: "The old town is steep and stony.",
            },
          ],
        },
      ],
    },
    {
      stage: "Staying well",
      tips: [
        {
          icon: "shield",
          title: "Avoid protests in central Tirana",
          text: "The UK government says protests on 15 October 2026 brought some violence and property damage.",
        },
        {
          icon: "health",
          title: "Call 112 if you see a wildfire",
          text: "Wildfires happen from April to October. Follow local advice.",
        },
        {
          icon: "shield",
          title: "Use licensed boat firms and watch your pockets",
          text: "Safety kit can be poor. Watch for pickpockets in tourist areas.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "food",
          title: "Ask to see the menu and prices",
          text: "Walk away from restaurants that will not show them. Get a receipt at official sites: tickets have been reused.",
        },
        {
          icon: "chat",
          title: "Round up, and try Greek in Himarë",
          text: "Tipping is not expected. Many people in Himarë speak Greek as well as Albanian.",
        },
      ],
    },
  ],
};
