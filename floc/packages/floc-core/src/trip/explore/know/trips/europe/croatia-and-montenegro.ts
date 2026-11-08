import type { TripKnow } from "../../know-types";

export const CROATIA_AND_MONTENEGRO: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Croatia", slug: "croatia" }, { country: "Montenegro", slug: "montenegro" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "boat",
          title: "Book the island boats early",
          text: "Boats are **€25** a leg in 2026. A ticket covers one sailing and one operator. July and August sell out days ahead. Buy at krilo.hr or tp-line.hr.",
          temporary: "Until the 2027 timetables are out",
        },
        {
          icon: "ticket",
          title: "Book Dubrovnik's walls online",
          text: "The adult ticket is **€40** and includes Fort Lovrijenac. It lasts **72 hours**, with one visit to each.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport dates",
          text: "UK passports get **90 days** visa-free in Croatia and **90 days** in Montenegro, on separate clocks. The passport must be under **10 years** old and valid for **3 months** after you leave.",
          link: { label: "UK entry rules for Croatia", href: "https://www.gov.uk/foreign-travel-advice/croatia/entry-requirements" },
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
          title: "Register within 24 hours in Montenegro",
          text: "Hotels do it for you. In a private let, you must do it yourself, at the tourist office or the police.",
          link: { label: "UK entry rules for Montenegro", href: "https://www.gov.uk/foreign-travel-advice/montenegro/entry-requirements" },
        },
        {
          icon: "plane",
          title: "Fly into Split and home from Tivat",
          text: "Tivat airport is a short drive from Kotor, under **15 min**. Book it as an open-jaw ticket.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry cash for islands and Kotor taxis",
          text: "Both countries use the euro. Cards work in the towns.",
        },
        {
          icon: "ticket",
          title: "Pay the Kotor fortress in cash",
          text: "Entry is **€15** at the gate.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "boat",
          title: "Use boats between the islands",
          text: "Catamarans link Split, Hvar, Korčula and Dubrovnik, with three sailings a day on each leg in 2026. Weather and port rules can change the times.",
        },
        {
          icon: "car",
          title: "Leave for the Montenegro border before 08:00",
          text: "Dubrovnik to Kotor is about **2h 30** without a queue. Allow **3 to 4h** in summer, and much more on a peak weekend. This is an outer border of the Schengen area.",
        },
        {
          icon: "car",
          title: "Get written permission for a rental car",
          text: "Ask the rental firm for it, and for a Green Card, before you cross into Montenegro.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Split",
          tips: [
            {
              title: "Reach Krka at opening time",
              text: "Skradin is about an hour from Split by road. Go at about **08:30** and leave before the coaches arrive at **11:00 to 12:00**. Swimming at the falls has been banned since 2021. Entry runs from about **€7** in winter to about **€40** in summer; check npkrka.hr.",
            },
            {
              title: "Take the 08:00 or 09:00 boat to Hvar",
              text: "No 10:00 sailing runs in the 2026 timetables. The Krilo boat leaves at **08:00** (1h) and the TP Line boat at **09:00** (1h 20). The next is at **15:10**.",
            },
          ],
        },
        {
          place: "Hvar",
          tips: [
            {
              title: "Check the Hvar fortress hours on arrival",
              text: "The Fortica fortress is **€12** for an adult. Check the opening hours when you arrive.",
            },
            {
              title: "Take the 09:10 or 10:40 boat to Korčula",
              text: "No 11:00 sailing runs. The Krilo boat takes **1h 10** and the TP Line boat **1h 25**.",
            },
          ],
        },
        {
          place: "Korčula",
          tips: [
            {
              title: "Check the Moreška sword dance dates",
              text: "It is not daily. Spring shows are at **21:00** on set dates, then a few in July, and the season ends on 14 October. Check the dates and the price on visitkorcula.eu.",
            },
            {
              title: "Take the 10:30 boat to Dubrovnik",
              text: "It arrives at **12:30**. The 15:40 boat calls at Mljet and arrives at **17:45**.",
            },
          ],
        },
        {
          place: "Dubrovnik",
          tips: [
            {
              title: "Walk the walls at 08:00",
              text: "They open at **08:00** only from 1 June to 15 September, and at **09:00** otherwise. They close at **18:00** from mid-September and at **15:00** from November, so dusk is not possible. Go one way, counterclockwise.",
            },
            {
              title: "Carry your case up the old town's steps",
              text: "Do not roll it. Shoes with grip help on polished stone.",
            },
          ],
        },
        {
          place: "Kotor",
          tips: [
            {
              title: "Take the bus, then a water taxi",
              text: "The bus is **€1** and the water taxi to Our Lady of the Rocks is **€5**. Boats from Kotor's gate cost **€15**.",
            },
            {
              title: "Climb the fortress at 07:00 to 08:00",
              text: "It is **1,350** steps. Keep your ticket stub, or you pay again.",
            },
            {
              title: "Agree the taxi price first",
              text: "Taxis often have no meter. Uber and Bolt do not run in Kotor.",
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
          title: "Wear swim shoes on stony beaches",
          text: "Sea urchins live there.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Say \"dobar dan\", and cover up in churches",
          text: "Dobar dan means good day. Dress covered for churches.",
        },
      ],
    },
  ],
};
