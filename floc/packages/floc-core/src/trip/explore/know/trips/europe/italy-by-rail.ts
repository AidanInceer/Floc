import type { TripKnow } from "../../know-types";

export const ITALY_BY_RAIL: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Italy", slug: "italy" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Book the big sights online",
          text: "Uffizi, Vatican, Colosseum, Borghese and Pompeii use timed slots that sell out days ahead. Colosseum tickets go on sale **30 days** ahead.",
        },
        {
          icon: "ticket",
          title: "Book a slot for the Florence dome climb",
          text: "The slot is named and timed. The dome is shut from 16 to 20 November 2026, and the bell tower from 9 to 13 November.",
          temporary: "Until 20 November 2026",
        },
        {
          icon: "ticket",
          title: "Plan around closed days",
          text: "The Uffizi is shut on Mondays. The Vatican Museums are shut on Sundays, except the last Sunday of the month, which is free with very long queues. The Colosseum is shut on 25 December and 1 January.",
        },
        {
          icon: "boat",
          title: "Plan a land route to Positano",
          text: "Most Positano ferries run from April to early November, and wind stops them. Ferries may not run in winter, so keep a bus plan.",
        },
        {
          icon: "train",
          title: "Book fast trains early",
          text: "Frecciarossa and Italo fares rise close to the travel date.",
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
          link: { label: "UK entry rules for Italy", href: "https://www.gov.uk/foreign-travel-advice/italy/entry-requirements" },
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
          icon: "plane",
          title: "Fly into Venice and home from Naples",
          text: "Open-jaw tickets often cost about the same as returns.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "boat",
          title: "Take the airport boat or bus into Venice",
          text: "The Alilaguna boat to San Marco takes **60 to 75 min** and costs about **€18**. The bus to Piazzale Roma is quicker; then take the water bus.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Keep coins for the bar",
          text: "Cards work almost everywhere.",
        },
        {
          icon: "food",
          title: "Expect a cover charge on the bill",
          text: "It is normally **€2 to 4** a person.",
        },
        {
          icon: "ticket",
          title: "Pay €2 to go near the Trevi Fountain",
          text: "The fee is charged from 2 February 2026, from **09:00 to 22:00**.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Use fast trains for the long legs",
          text: "Venice to Florence takes about **2h to 2h 15**. La Spezia to Rome takes about **3h 35 to 4h 40**, or you change at Pisa or Florence. Check times on Trenitalia.",
        },
        {
          icon: "train",
          title: "Stamp paper regional tickets on the platform",
          text: "Use the validating machine before you board.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Venice",
          tips: [
            {
              title: "Check the Venice day-tripper fee",
              text: "Day-trippers pay **€5** booked early or **€10** late on set days, from 08:30 to 16:00. In 2026 these ran from 3 April to 26 July. Hotel guests are exempt but may need to register for a free code. City tax is paid at the hotel.",
            },
            {
              title: "Go to the basilica on a weekday",
              text: "San Marco opens at **09:30** Monday to Saturday and at **14:00** on Sundays.",
            },
          ],
        },
        {
          place: "Florence",
          tips: [
            {
              title: "Take the bus to Siena, not a car",
              text: "A hire car for one day means fines in restricted traffic zones. The Rapida bus (line 131R) takes about **1h 15** from the coach station by Santa Maria Novella. The train takes about **1h 30**.",
            },
            {
              title: "Book the Uffizi first thing, not on Monday",
              text: "Prices are **€25** on the day and **€29** booked ahead.",
            },
          ],
        },
        {
          place: "Cinque Terre",
          tips: [
            {
              title: "Check the trail status each morning",
              text: "Sections close for rain or rockfall. The Blue Trail needs a card, about **€7.50** a day; confirm on the park site. The card includes Via dell'Amore, which needs a timed slot.",
            },
            {
              title: "Plan around the train stops",
              text: "Trains between Corniglia and La Spezia stop for 48 hours on 14 to 15 November, 19 to 20 December 2026, 9 to 10 January and 6 to 7 February 2027. Night trains from Levanto to La Spezia stop too.",
              temporary: "Until 7 February 2027",
            },
          ],
        },
        {
          place: "Rome",
          tips: [
            {
              title: "Book the first Vatican slot",
              text: "The museums open Monday to Saturday from **08:00** to **20:00**, with last entry at **18:00**.",
            },
            {
              title: "Ignore costumed gladiators",
              text: "They charge for photos.",
            },
          ],
        },
        {
          place: "Naples",
          tips: [
            {
              title: "Take the Circumvesuviana to Pompeii",
              text: "From Napoli Garibaldi it takes about **35 to 40 min**. From 1 November the site closes at **17:00**, with last entry at **15:30**. Check the official site for your day.",
            },
          ],
        },
        {
          place: "Positano",
          tips: [
            {
              title: "Start the Path of the Gods from Amalfi",
              text: "No direct bus runs from Positano to Bomerano. Take the **07:30** bus to Amalfi, then the bus up, about **2h** in all. Walk from about **10:00** to Nocelle, then take a local bus (carry cash) or about **1,500** steps down.",
            },
            {
              title: "Leave for Naples airport by 07:00",
              text: "Transfers take **70 min** to **1h 30**, and **2h to 3h** in summer weekend traffic. Or book a flight after **14:00**.",
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
          title: "Watch for pickpockets",
          text: "They work in Rome, Florence and on the Circumvesuviana.",
        },
        {
          icon: "health",
          title: "Expect small tremors near Naples",
          text: "The Campi Flegrei area has regular small earthquakes.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Cover shoulders and knees in churches",
          text: "The same goes for the Vatican.",
        },
        {
          icon: "food",
          title: "Eat away from the main sights",
          text: "Skip menus with photos near San Marco and the Colosseum. Try Cannaregio, Oltrarno or Trastevere. Many restaurants close one day a week.",
        },
        {
          icon: "walk",
          title: "Pack soft bags for Positano",
          text: "The town is all steps, so wheeled cases are hard.",
        },
      ],
    },
  ],
};
