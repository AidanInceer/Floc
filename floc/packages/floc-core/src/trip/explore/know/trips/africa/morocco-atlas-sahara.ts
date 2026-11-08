import type { TripKnow } from "../../know-types";

export const MOROCCO_ATLAS_SAHARA: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Morocco", slug: "morocco" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "car",
          title: "Plan 5 to 7 hours to Aït Benhaddou",
          text: "The paved road ends at Imlil, so the way on goes back via Marrakech and over the Tizi n'Tichka pass. It takes about **5h to 5h 30** direct and up to **7h** with a stop at Telouet. Leave by **07:30**.",
        },
        {
          icon: "ticket",
          title: "Book Fes riads and the dune camp early",
          text: "They fill in the spring and autumn months.",
        },
        {
          icon: "moon",
          title: "Pack a warm layer for winter nights",
          text: "Nights in the desert and mountains fall below freezing.",
        },
        {
          icon: "weather",
          title: "Check the pass for snow in winter",
          text: "The Tizi n'Tichka can have snow or ice from November to March.",
        },
        {
          icon: "moon",
          title: "Plan around Ramadan in early 2027",
          text: "It starts about **8 February**: daytime restaurants close and hours change.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport",
          text: "UK passports need no visa for up to **90 days**. The passport must be valid **3 months** after you arrive.",
        },
        {
          icon: "health",
          title: "Buy cover that names trekking and desert camping",
          text: "The UK government says cover must match your planned activities.",
        },
        {
          icon: "plane",
          title: "Buy flights into Marrakech and out of Fes",
          text: "An open-jaw ticket saves an **8h** drive back.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry small dirham notes",
          text: "Guesthouses and drivers often cannot change large ones. Dirhams are not exchangeable abroad and you may not take out more than **2,000 dirhams**.",
        },
        {
          icon: "money",
          title: "Draw cash in Marrakech or Ouarzazate",
          text: "Small-town cash machines can run short at weekends, and Merzouga has one unreliable machine. Draw cash on a Friday or Saturday morning.",
        },
        {
          icon: "money",
          title: "Start haggling near half the price",
          text: "Do not say where you are staying.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Use one driver for the whole loop",
          text: "Do not drive after dark. Mountain roads are hazardous in poor weather.",
        },
        {
          icon: "fuel",
          title: "Fill the tank before the Fes day",
          text: "The drive is **8h**. Buy water the evening before and stop at Midelt or Azrou for lunch.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Marrakech",
          tips: [
            {
              title: "Book Jardin Majorelle online and go first thing",
              text: "Tickets are sold online only. Check the opening hours on the site.",
              link: { label: "Book Jardin Majorelle", href: "https://jardinmajorelle.com/ang/visit/" },
            },
            {
              title: "Use petit taxis with the meter on",
              text: "Insist on the meter, or walk.",
            },
          ],
        },
        {
          place: "Imlil",
          tips: [
            {
              title: "Hire a professional guide for hiking",
              text: "The UK government advises it. The 2023 earthquake destroyed or badly damaged Imlil and Asni.",
            },
          ],
        },
        {
          place: "Aït Benhaddou",
          tips: [
            {
              title: "Climb to the granary at sunset",
              text: "It is free.",
            },
          ],
        },
        {
          place: "Dades gorge",
          tips: [
            {
              title: "Walk the Todra gorge on the way",
              text: "Todra is a separate gorge near Tinghir. Leave Dades at **08:00** to be on foot by **09:00**.",
            },
          ],
        },
        {
          place: "Erg Chebbi",
          tips: [
            {
              title: "Ask your camp for the month's sunrise time",
              text: "Sunrise at **06:00** is only right in summer.",
            },
          ],
        },
        {
          place: "Fes",
          tips: [
            {
              title: "See the Chouara tannery early",
              text: "Go about **09:30** from a leather-shop terrace and tip a few dirhams. Say no to a shop tour.",
            },
            {
              title: "Use a licensed guide in the medina",
              text: "Fake guides work the medina and tanneries. Ignore touts who say a road is closed.",
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
          title: "Drink bottled water and wear sun cream",
          text: "The sun is strong at altitude. Imlil sits at about **1,740 m**: mild altitude only.",
        },
        {
          icon: "lock",
          title: "Keep your card in sight",
          text: "Card fraud is common.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Dress modestly and ask before photos",
          text: "Ask before you photograph a person. Do not photograph military or political sites. Drones need permission from the civil aviation authority.",
        },
        {
          icon: "chat",
          title: "Say salam to greet and shukran to thank",
          text: "Salam is hello and shukran is thank you.",
        },
        {
          icon: "customs",
          title: "Keep affection private",
          text: "Same-sex acts are illegal.",
        },
      ],
    },
  ],
};
