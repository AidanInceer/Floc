import type { TripKnow } from "../../know-types";

export const PETRA_AND_WADI_RUM: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Jordan", slug: "jordan" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "shield",
          title: "Read the UK government's Jordan warnings",
          text: "It warns of regional conflict and airspace closures, and advises against all travel within **3 km** of the Syria border. Insure against disruption.",
        },
        {
          icon: "weather",
          title: "Go in spring or early autumn",
          text: "Spring is March to May and autumn is October to early November. Wadis flash-flood from November to March, and desert nights are very cold even in spring and autumn.",
        },
        {
          icon: "ticket",
          title: "Book Petra by Night, Sunday to Thursday",
          text: "It runs **20:30 to about 22:30** and costs **30 dinars**, with under-10s free. Confirm the dates before you book.",
          link: { label: "See Petra by Night", href: "https://www.visitpetra.jo/en/Event/25" },
        },
        {
          icon: "ticket",
          title: "Book your Wadi Rum camp and diving",
          text: "Arrange both before you go.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Buy the Jordan Pass before you arrive",
          text: "It costs **70, 75 or 80 dinars** for 1, 2 or 3 days at Petra and waives the **40 dinar** visa on arrival if you stay long enough. This trip has four nights, which is safe under both the pass site's two-night rule and the UK government's three.",
          link: { label: "See Jordan Pass prices", href: "https://jordanpass.jo/contents/Prices.aspx" },
        },
        {
          icon: "lock",
          title: "Buy the pass from the official site only",
          text: "The UK government says to use only the official site.",
        },
        {
          icon: "passport",
          title: "Check your passport has 6 months left",
          text: "It needs **6 months** left on the day you arrive.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly into Amman or Aqaba",
          text: "Amman to Petra is about **3 hours** by road, and Aqaba is about **2 hours** from Petra.",
        },
        {
          icon: "car",
          title: "Take care on the Desert Highway",
          text: "The UK government warns of fatal accidents there. Drive with care at night.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "ticket",
          title: "Budget for the Petra ticket",
          text: "It is **50, 55 or 60 dinars** for 1, 2 or 3 days if you stay overnight in Jordan, and **90 dinars** for a one-day visitor. The day ticket does not cover Petra by Night.",
          link: { label: "See Petra fees", href: "https://visitpetra.jo/en/Petrafees" },
        },
        {
          icon: "money",
          title: "Carry cash and small notes",
          text: "Many places lack change, and cash machines are mainly in Amman and larger towns.",
        },
        {
          icon: "ticket",
          title: "Budget for Wadi Rum",
          text: "Camps cost **20 to 80 dinars** a person and jeeps **50 to 75 dinars** a jeep with a guide. Entry is **5 dinars**, free with the pass. Haggle.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Book a driver or bus to Wadi Rum",
          text: "It takes **1h 30 to 2h**. A public bus costs about **7 dinars** and a taxi **30 to 35 dinars**. Agree the taxi fare first.",
        },
        {
          icon: "car",
          title: "Pre-book the driver to Aqaba",
          text: "The minibus runs only at **06:30**, and a taxi costs **20 to 35 dinars**. The trip takes about **1 hour**.",
        },
        {
          icon: "car",
          title: "Carry a driving permit if you drive",
          text: "You need a 1949 international driving permit plus your UK licence.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Petra",
          tips: [
            {
              title: "Climb the Monastery by 08:00",
              text: "It is **800+** steps and over an hour, shaded only later in the day.",
            },
            {
              title: "Enter Petra from 06:30 in winter",
              text: "Petra is open **06:30 to 17:00** from 2 October 2026 to 1 March 2027.",
              link: { label: "See Petra opening hours", href: "https://visitpetra.jo/en/Openinghours" },
            },
            {
              title: "Agree a price for horse rides",
              text: "Rides to the Siq are free but expect to tip. Agree the price before any longer ride.",
            },
            {
              title: "Keep your ticket from fake rangers",
              text: "Never hand your ticket to anyone claiming to be a ranger.",
            },
          ],
        },
        {
          place: "Wadi Rum",
          tips: [
            {
              title: "Ask for extra blankets at camp",
              text: "Nights are cold.",
            },
            {
              title: "Download offline maps before you go",
              text: "Mobile coverage in Wadi Rum is weak.",
            },
            {
              title: "Do not count on alcohol at camp",
              text: "Camps may not stock it. It is sold in Aqaba and tourist areas.",
            },
          ],
        },
        {
          place: "Aqaba",
          tips: [
            {
              title: "Book a diving school for the Red Sea",
              text: "Do not snorkel or dive alone. You only have one night, so it is a half day.",
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
          title: "Carry 4 litres of water on hot days",
          text: "Add a hat, sunglasses and sunscreen. Petra is **8 to 10 km** round trip with the Monastery.",
        },
        {
          icon: "weather",
          title: "Avoid wadis after heavy rain",
          text: "Flash floods can happen from November to March, for a day after heavy rain.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Wear modest clothing",
          text: "Dress modestly in towns and at sites.",
        },
      ],
    },
  ],
};
