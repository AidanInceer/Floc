import type { TripKnow } from "../../know-types";

export const ISTANBUL_AND_CAPPADOCIA: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Turkey", slug: "turkey" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "sun",
          title: "Keep a spare morning for the balloon",
          text: "About 1 in 6 planned flights was cancelled in 2025 to 2026, mostly for wind. Two nights in Göreme give one chance, so add a third night.",
        },
        {
          icon: "money",
          title: "Compare balloon prices and ask about refunds",
          text: "Prices run from about **€100** to **€260** a person, cheaper in winter. Flights last **45 to 60 min** after a pre-dawn pickup. Refunds and rebooking vary by operator.",
        },
        {
          icon: "weather",
          title: "Go in April to June, September or October",
          text: "Winter in Cappadocia is cold and snowy, and the paths can be icy.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport dates",
          text: "UK citizens need no visa for **90 days** in any 180. The passport must be valid for **150 days** after you arrive, with one blank page. Other British passport types may need a visa.",
          link: { label: "UK entry rules for Turkey", href: "https://www.gov.uk/foreign-travel-advice/turkey/entry-requirements" },
        },
        {
          icon: "health",
          title: "Buy travel insurance with medical cover",
          text: "UK health cards for Europe are not valid in Turkey. Carry medicines in their original packs with a doctor's letter: UK prescriptions are not accepted in Turkish pharmacies.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Choose the metro or bus from Istanbul Airport",
          text: "The M11 metro and Havaist buses reach the city. A taxi to Sultanahmet takes **45 to 70 min**, depending on traffic.",
        },
        {
          icon: "car",
          title: "Use a metered taxi and note its number",
          text: "Make sure the meter runs. The UK government advises registered taxis only.",
          link: { label: "UK safety advice for Turkey", href: "https://www.gov.uk/foreign-travel-advice/turkey/safety-and-security" },
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry some lira for small shops",
          text: "Cards work in most places and cash machines are widespread, but some sites take only lira. Change money in the city, not at the airport.",
        },
        {
          icon: "lock",
          title: "Keep lira worth under US$5,000 when you leave",
          text: "You may not take out more than that.",
        },
        {
          icon: "ticket",
          title: "Budget about €25 for Hagia Sophia",
          text: "This is the fee for foreign visitors, with the upper gallery, since January 2024. The Museum Pass does not cover it; the pass covers Topkapı. Check the price before you go.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "plane",
          title: "Allow about 3h from Istanbul to Göreme",
          text: "The flight to Nevşehir takes about **1h 20**. A shuttle or taxi then takes about **40 min** to Göreme.",
        },
        {
          icon: "train",
          title: "Buy an Istanbulkart for the city",
          text: "It works on buses, trams, the metro and ferries. The ferry to Kadıköy takes about **20 min**.",
        },
        {
          icon: "walk",
          title: "Reach Rose Valley by walking, taxi or tour",
          text: "It is about **2 km** north of Göreme. Minibuses called dolmuş run every **30 to 60 min** in Cappadocia.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Istanbul",
          tips: [
            {
              title: "Plan around closed days",
              text: "Topkapı is shut on Tuesday. The Grand Bazaar is shut on Sunday and on religious holidays; the Spice Bazaar opens on Sundays. Hagia Sophia opens daily.",
            },
            {
              title: "Ask the price first",
              text: "Friendly strangers who lead you to a restaurant, guides at the Blue Mosque who then ask for money, and menus with market prices all cost more.",
            },
          ],
        },
        {
          place: "Göreme",
          tips: [
            {
              title: "Go to the Open Air Museum early",
              text: "Go before the groups arrive.",
            },
            {
              title: "Expect a pre-dawn pickup for the balloon",
              text: "Balloons launch at sunrise. An overcast sky flattens the rock formations.",
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
          title: "Take care in busy areas",
          text: "The UK government says terror attacks are likely in Turkey, and Istanbul is a named area. Protests can turn violent, and pickpockets work tourist areas.",
          link: { label: "UK safety advice for Turkey", href: "https://www.gov.uk/foreign-travel-advice/turkey/safety-and-security" },
        },
        {
          icon: "health",
          title: "Drink only spirits you saw poured",
          text: "Fake spirits have caused deaths.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Dress modestly; do not photograph military sites",
          text: "Do not photograph military sites.",
        },
        {
          icon: "customs",
          title: "Never insult Atatürk or the flag",
          text: "It is a crime in Turkey.",
        },
      ],
    },
  ],
};
