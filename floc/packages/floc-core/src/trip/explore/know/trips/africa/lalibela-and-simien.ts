import type { TripKnow } from "../../know-types";

export const LALIBELA_AND_SIMIEN: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Ethiopia", slug: "ethiopia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "shield",
          title: "Read the UK warning before you plan",
          text: "The UK government advises against all travel to the Amhara region, which holds Lalibela, Gondar and the Simien mountains. It warns of fighting, banditry and kidnapping, and your insurer may refuse claims.",
          link: { label: "UK travel advice for Ethiopia", href: "https://www.gov.uk/foreign-travel-advice/ethiopia" },
        },
        {
          icon: "plane",
          title: "Book flights early and keep a spare day",
          text: "Flights from Lalibela to Gondar can be overbooked or cancelled, so book early and keep a buffer day. Then it is **3 hours** by road to Debark, then a trek.",
        },
        {
          icon: "ticket",
          title: "Book early for 7 and 19 January",
          text: "Genna (**7 January**) and Timkat (**19 January**) fill Lalibela.",
        },
        {
          icon: "weather",
          title: "Go between October and March",
          text: "These are the dry months for the highlands.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get your visa online",
          text: "The online visa is valid for **30 days**, single entry. Your passport needs **6 months** left.",
          link: { label: "Apply for the Ethiopia visa", href: "https://evisa.gov.et" },
        },
        {
          icon: "plane",
          title: "Fly to Addis Ababa first",
          text: "Then take Ethiopian Airlines inland. Reconfirm a day before each flight.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Book a hotel transfer from the airport",
          text: "The UK government advises a hotel transfer or taxi app. Lalibela airport is about **19 km** from town, about **30 min** by shared minibus.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Bring cash and keep receipts",
          text: "Birr is used inside the country and you may carry in at most **3,000 birr**. Cash machines often fail outside Addis, so bring clean US dollar notes and change at banks, not on the street.",
        },
        {
          icon: "ticket",
          title: "Pay church tickets and park fees in cash",
          text: "Carry enough birr or dollars for these. Keep exchange receipts so you can change leftover birr back.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "moon",
          title: "Do not drive after dark",
          text: "The UK government warns of fighting, banditry and kidnapping in Amhara.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Lalibela",
          tips: [
            {
              title: "Buy one ticket for all the churches",
              text: "It costs **US$50** and is valid for **5 days**. Carry your passport with it. Dawn service starts about **05:50**. Check the price on arrival.",
            },
            {
              title: "Use guides from the tourist office",
              text: "Ask the tourist office for a guide.",
            },
            {
              title: "Take off your shoes at every church",
              text: "Slip-ons help. Cover shoulders and knees.",
            },
          ],
        },
        {
          place: "Simien mountains",
          tips: [
            {
              title: "Hire a scout through the Debark park office",
              text: "A scout is compulsory in the park. The office arranges scout, guide and cook: use a licensed agency, and do not prepay a tout in Gondar.",
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
          title: "Go slowly at altitude",
          text: "Simien Lodge is at **3,260 m** and the Geech and Chennek camps are about **3,600 m**. Tell your guide about any headache.",
        },
        {
          icon: "drop",
          title: "Drink bottled water and carry first aid",
          text: "Do not drink tap water. Clinics outside Addis are very limited.",
        },
        {
          icon: "weather",
          title: "Pack a down jacket and warm sleeping bag",
          text: "Simien nights are cold in every month.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Download offline maps before you go",
          text: "Mobile networks and internet can be cut with no notice. Calls on a messaging app often work when other apps do not.",
        },
        {
          icon: "customs",
          title: "Ask before you photograph people",
          text: "Ask first, every time.",
        },
      ],
    },
  ],
};
