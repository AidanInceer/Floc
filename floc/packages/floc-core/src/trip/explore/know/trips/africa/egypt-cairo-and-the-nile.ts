import type { TripKnow } from "../../know-types";

export const EGYPT_CAIRO_AND_THE_NILE: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Egypt", slug: "egypt" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "shield",
          title: "Stay on the places the UK government allows",
          text: "It advises against all travel to North Sinai and within **20 km** of the Libya border, and against all but essential travel to parts of the Western Desert. Luxor, Aswan, Abu Simbel and the Valley of the Kings are exceptions to the Western Desert warning.",
          link: { label: "UK travel advice for Egypt", href: "https://www.gov.uk/foreign-travel-advice/egypt" },
        },
        {
          icon: "weather",
          title: "Go between November and March",
          text: "October and April are hot at Luxor and Aswan. Christmas, New Year and Easter are the busiest and dearest.",
        },
        {
          icon: "ticket",
          title: "Book the Grand Egyptian Museum slot ahead",
          text: "Entry is by timed slot. Foreign tickets rose by about **US$5** from 1 November 2026, so read the price on the booking page.",
          link: { label: "Book Grand Egyptian Museum tickets", href: "https://tickets.gem.eg/" },
        },
        {
          icon: "ticket",
          title: "Book Abu Simbel through your boat",
          text: "Ask how the departure runs. A 45-minute flight is the other way there.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get your visa online or on arrival",
          text: "UK passports can use an online visa or buy one on arrival for **US$30** in cash. From 1 August 2026 at Cairo airport a digital visa is **US$36**, card only.",
        },
        {
          icon: "passport",
          title: "Check your passport has 6 months left",
          text: "It needs **6 months** left after you arrive and a blank page.",
        },
        {
          icon: "health",
          title: "Ask about vaccines 8 weeks ahead",
          text: "The UK government points to the UK travel health advice service.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry small Egyptian pounds for tips",
          text: "Tips are expected at nearly every service. You may carry up to **5,000 Egyptian pounds** in or out, and must declare foreign cash over **US$10,000**.",
        },
        {
          icon: "money",
          title: "Pay by card at the Luxor Nobles' tombs",
          text: "It is cashless from the 2026 season. Keep cash for boat crew tips and ask your boat about its policy.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "moon",
          title: "Do not drive outside cities at night",
          text: "The UK government advises against it.",
        },
        {
          icon: "boat",
          title: "Ask your boat about the Esna lock",
          text: "Boats queue at the lock, so ask when yours goes through.",
        },
        {
          icon: "boat",
          title: "Expect two nights on the boat at Edfu",
          text: "The boat stays moored there.",
        },
        {
          icon: "plane",
          title: "Leave 4 hours before a long-haul flight home",
          text: "A **09:00** flight from Aswan to Cairo and a **14:00** connection is tight.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Cairo",
          tips: [
            {
              title: "Be at the Giza plateau at opening",
              text: "It opens about **07:00** and closes at **17:00**, or **16:00** in winter. Hours change in Ramadan. The Great Pyramid interior is a separate ticket and can sell out by mid-morning.",
            },
            {
              title: "Go to the Grand Egyptian Museum late",
              text: "Choose a Wednesday or Saturday and go from **16:00**. Allow **3 to 4 hours**.",
            },
          ],
        },
        {
          place: "Luxor",
          tips: [
            {
              title: "Reach the Valley of the Kings by 06:30",
              text: "It opens at **06:00**. Hatshepsut's temple on an open ramp is better by **09:30** than midday. Hatshepsut closes at **16:00** in winter.",
            },
            {
              title: "See Luxor temple at dusk",
              text: "Go about **17:30**. It closes at **19:00**.",
            },
          ],
        },
        {
          place: "Aswan",
          tips: [
            {
              title: "Leave for Abu Simbel at 04:00",
              text: "The drive is **3 to 4 hours** each way, so a **04:00** start arrives after sunrise. The site opens at **06:00**.",
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
          title: "Drink sealed water and wear a hat",
          text: "Wear a hat. The sun is strong from **10:00** even in winter.",
        },
        {
          icon: "weather",
          title: "Pack a layer for dawn and night",
          text: "Winter dawn and night are cool.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Cover shoulders and knees at mosques and churches",
          text: "Cover shoulders and knees when you go inside.",
        },
        {
          icon: "customs",
          title: "Ask before you photograph people",
          text: "Do not photograph military property. Drones need permission first.",
        },
        {
          icon: "money",
          title: "Agree a price before any ride",
          text: "Haggle hard for camel and horse rides near Giza and agree the price before you climb on.",
        },
        {
          icon: "money",
          title: "Say no to papyrus and perfume shop stops",
          text: "These shops pay guides a commission.",
        },
      ],
    },
  ],
};
