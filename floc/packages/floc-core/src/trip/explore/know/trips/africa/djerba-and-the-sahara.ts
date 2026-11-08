import type { TripKnow } from "../../know-types";

export const DJERBA_AND_THE_SAHARA: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Tunisia", slug: "tunisia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "shield",
          title: "Keep clear of the southern border areas",
          text: "The UK government advises against all travel to Ben Guerdane, the military zone south of El Borma and Dhehiba, and within **20 km** of the Libya border. It advises against all but essential travel within **75 km** of it, including Remada. Djerba, Douz and Matmata are not listed.",
          link: { label: "UK travel advice for Tunisia", href: "https://www.gov.uk/foreign-travel-advice/tunisia" },
        },
        {
          icon: "car",
          title: "Plan a long day for Tataouine and Matmata",
          text: "Djerba to Douz is about **4h** direct. A day via Tataouine and Matmata takes **6h or more**. The ksar (hilltop granary village) at Ouled Soltane is near Tataouine, not on the direct road. Chenini draws crowds; Douiret is quiet.",
        },
        {
          icon: "weather",
          title: "Go in spring or autumn",
          text: "March to May, October and November are comfortable. Summer is very hot and winter nights in the desert are cold.",
        },
        {
          icon: "ticket",
          title: "Book ahead for the Sahara Festival",
          text: "It is held towards the end of the year. Book the Douz camp and a driver for Tataouine early.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport",
          text: "UK passports need no visa for up to **90 days**. The passport must be valid for your whole stay. Border staff may ask for proof of accommodation and a return ticket.",
        },
        {
          icon: "customs",
          title: "Leave drones and smart glasses at home",
          text: "Drones are illegal without authorisation and are confiscated. Smart glasses and walkie-talkies can be confiscated.",
        },
        {
          icon: "customs",
          title: "Declare your foreign cash",
          text: "Declare all foreign currency, including sterling, and keep the exchange receipts.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Insist on the meter in the airport taxi",
          text: "A taxi to Houmt Souk is about **20 dinars**. Ride apps are unreliable: Bolt stopped working in 2025.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Keep your exchange receipts",
          text: "The dinar cannot leave the country, so you need receipts to change leftovers back.",
        },
        {
          icon: "ticket",
          title: "Pay the hotel tax at the hotel",
          text: "It is **8 dinars** a person a night in a 3-star and **12 dinars** in a 4 or 5-star, for up to ten nights.",
        },
        {
          icon: "money",
          title: "Carry cash for the desert camp and tips",
          text: "Cash machines take Visa and Mastercard in towns. Prices show millimes: 5.600 is 5.6 dinars.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire a car and driver for the south",
          text: "Night roads are unlit and driving standards are low. Most ksour are out of town, so a taxi for the day is needed.",
        },
        {
          icon: "car",
          title: "Use shared taxis only when time allows",
          text: "Louages leave when full, with **8** passengers, at fixed fares. They can be scarce after **15:00**.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Djerba",
          tips: [
            {
              title: "Check the Ghriba synagogue is open",
              text: "Visitor rules and hours can change, so check before you go. The UK government warns terrorists are likely to try attacks and religious sites carry a higher risk.",
            },
          ],
        },
        {
          place: "Douz",
          tips: [
            {
              title: "Agree the camel price before you sit",
              text: "Negotiate first.",
            },
          ],
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Dress more modestly the further south you go",
          text: "Dress is relaxed on the beach.",
        },
        {
          icon: "customs",
          title: "Keep affection private",
          text: "Same-sex acts are illegal.",
        },
        {
          icon: "food",
          title: "Buy alcohol in licensed places",
          text: "It is sold in licensed venues, resorts and some shops. It is banned from supermarkets on Fridays and during Ramadan, expected about **8 February to 8 March** in 2027.",
        },
        {
          icon: "chat",
          title: "Buy a prepaid phone card",
          text: "Ooredoo, Orange and Tunisie Telecom sell them. Ask for a carte prépayée.",
        },
      ],
    },
  ],
};
