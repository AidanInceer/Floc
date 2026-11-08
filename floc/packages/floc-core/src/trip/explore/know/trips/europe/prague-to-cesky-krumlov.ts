import type { TripKnow } from "../../know-types";

export const PRAGUE_TO_CESKY_KRUMLOV: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Czech Republic", slug: "czech-republic" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Reserve the castle theatre tour",
          text: "The guided visit takes up to 20 people and costs **400 koruna**. It runs 1 May to 31 October, Tuesday to Sunday, **10:00 to 16:00**, last tour **15:00**.",
          link: { label: "Český Krumlov Castle tours", href: "https://www.zamek-ceskykrumlov.cz/en/plan-your-visit/tours" },
        },
        {
          icon: "weather",
          title: "Go in May, June or September for rafting",
          text: "The Vltava is very crowded from late June to August. Vydra rafts run only at weekends in May and June, and daily from July to September.",
        },
        {
          icon: "pin",
          title: "Stay overnight in Český Krumlov",
          text: "Rooms are limited and often small. Day-trippers leave in the afternoon.",
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
          link: { label: "UK entry rules for the Czech Republic", href: "https://www.gov.uk/foreign-travel-advice/czech-republic/entry-requirements" },
        },
        {
          icon: "passport",
          title: "Allow extra time at the border",
          text: "The EU's new Entry/Exit System (EES) takes your fingerprints and photo on your first entry. Queues are longer that day.",
          link: { label: "Read the UK guide to the Entry/Exit System", href: "https://www.gov.uk/guidance/eu-entryexit-system" },
        },
        {
          icon: "passport",
          title: "Check the EU travel authorisation before you book",
          text: "The European Travel Information and Authorisation System (ETIAS) is not running yet and has no confirmed start date.",
          link: { label: "Check the official EU travel site", href: "https://travel-europe.europa.eu" },
        },
        {
          icon: "passport",
          title: "Register your address within 3 days",
          text: "Your hotel does it. Missing it can mean a fine of up to **3,000 koruna**.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "train",
          title: "Take bus 59, then the metro",
          text: "The bus runs to Nádraží Veleslavín in **17 min**; then take metro line A to the centre.",
        },
        {
          icon: "car",
          title: "Avoid airport taxi touts",
          text: "Use Uber or an official taxi. Touts rig meters, and the fare to the centre is about **700 koruna**.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Use the koruna and decline paying in pounds",
          text: "Some places take euros but give a poor rate. Round up instead of tipping.",
        },
        {
          icon: "money",
          title: "Avoid Euronet cash machines",
          text: "They add a fee and mostly give **1,000 koruna** notes.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Take the bus to Český Krumlov",
          text: "RegioJet leaves from Na Knížecí, takes about **3h** and costs about **200 koruna**. A direct train leaves Praha hlavní nádraží at **08:01** and arrives at **10:55**. Check cd.cz.",
        },
        {
          icon: "ticket",
          title: "Stamp your Prague paper ticket",
          text: "A bad one can cost up to **2,000 koruna**. The Lítačka app is about 10% cheaper; buy before you board, because a ticket is valid one minute after you activate it.",
        },
        {
          icon: "walk",
          title: "Allow time for the walk from the station",
          text: "In Český Krumlov, the train station is a **15 to 20 min** downhill walk from the centre. Bus stops are **5 to 10 min** from the square.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Prague",
          tips: [
            {
              title: "Ask tram inspectors for photo identity",
              text: "False inspectors ride trams between Malostranské náměstí and Prague Castle.",
            },
            {
              title: "See the castle and Charles Bridge by 09:00",
              text: "The grounds open at **06:00**; the historic buildings open at **09:00**. Check hrad.cz for hours.",
            },
          ],
        },
        {
          place: "Český Krumlov",
          tips: [
            {
              title: "Wear shoes for cobbles",
              text: "The castle is uphill.",
            },
            {
              title: "Walk the town in the evening",
              text: "Day-trippers have left by then.",
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
          title: "Watch your pockets on Charles Bridge",
          text: "Pickpockets work there.",
        },
        {
          icon: "shield",
          title: "Avoid the station park after dark",
          text: "Take the metro instead.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "food",
          title: "Check the bill at Old Town Square restaurants",
          text: "Cover charges are common. Book bridge boat trips with the boat company, not touts.",
        },
        {
          icon: "chat",
          title: "Say \"dobrý den\" and \"děkuji\"",
          text: "They mean good day and thank you.",
        },
      ],
    },
  ],
};
