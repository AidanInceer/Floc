import type { TripKnow } from "../../know-types";

export const HANOI_TO_BANGKOK: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Vietnam", slug: "vietnam" },
    { country: "Cambodia", slug: "cambodia" },
    { country: "Thailand", slug: "thailand" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "shield",
          title: "Fly from Siem Reap to Bangkok",
          text: "Land crossings between Cambodia and Thailand are suspended, and the UK government advises against all but essential travel within **20 km** of the border.",
          temporary: "Until the land crossings reopen",
        },
        {
          icon: "weather",
          title: "Travel between January and March",
          text: "Hue and Hoi An flood from October to December, and roads, the Hai Van pass and trains can stop for a day or more.",
        },
        {
          icon: "train",
          title: "Book the night train a month ahead",
          text: "The night train leaves Hanoi at **21:45** and reaches Hue about **10:25**. It sells out in peak season, and times change, so check with Vietnam Railways.",
          link: { label: "Book at dsvn.vn", href: "https://dsvn.vn" },
        },
        {
          icon: "ticket",
          title: "Book the Ha Long Bay cruise and Angkor driver",
          text: "Arrange both before you leave.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check each passport rule",
          text: "Your passport needs **6 months** left after you arrive in all three countries, with **2** blank pages for Vietnam and **1** for Thailand.",
        },
        {
          icon: "passport",
          title: "Skip a visa for Vietnam",
          text: "UK passports get **45 days** visa-free.",
        },
        {
          icon: "passport",
          title: "Apply for the Cambodia visa online",
          text: "Apply at least **4 days** ahead. The fee is about **US$30 to 36** on the official site, and look-alike sites charge **£50** or more.",
          link: { label: "Apply at evisa.gov.kh", href: "https://evisa.gov.kh" },
        },
        {
          icon: "passport",
          title: "Fill in the free Cambodia arrival card",
          text: "Do it within **7 days** before you fly in.",
          link: { label: "Fill it in at arrival.gov.kh", href: "https://arrival.gov.kh" },
        },
        {
          icon: "passport",
          title: "Prepare for Thailand's new entry rules",
          text: "UK passports get **30 days** visa-free since 15 September 2026. Fill in the free Thai Digital Arrival Card up to **3 days** before, and keep proof of onward travel and **10,000 baht** in funds ready.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "pin",
          title: "Take Grab from Noi Bai airport",
          text: "The Old Quarter is about **45 minutes** away. Use the app, not street taxis.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry clean US$1 and US$5 notes",
          text: "Cambodia uses US dollars and riel, and torn notes are refused.",
        },
        {
          icon: "money",
          title: "Carry dong for Vietnam",
          text: "Markets, trains and street food take cash. Use bank cash machines, not tourist kiosks.",
        },
        {
          icon: "ticket",
          title: "Choose the right Angkor pass",
          text: "It costs **US$37** for 1 day, **US$62** for 3 days within 7, or **US$72** for 7 days within 30.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Use Grab in cities",
          text: "It works in Hanoi, Hue, Hoi An, Ho Chi Minh City, Phnom Penh and Bangkok.",
        },
        {
          icon: "car",
          title: "Keep a buffer from Hue to Hoi An",
          text: "The drive takes **2h 30 to 3h 30**, and the pass road adds about **30 minutes** over the tunnel. The pass has closed after landslides.",
        },
        {
          icon: "car",
          title: "Allow 6 to 7 hours to Phnom Penh",
          text: "The bus from Ho Chi Minh City includes the border at Moc Bai and Bavet. It usually takes **6 to 7 hours**, and can take from **5 to 8**.",
        },
        {
          icon: "car",
          title: "Plan about 6 hours to Siem Reap",
          text: "The bus from Phnom Penh takes about **6 hours**.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Hanoi",
          tips: [
            {
              title: "Leave bags at the hotel for Ha Long Bay",
              text: "Pick-up is about **08:00** and the return about **18:00**, so ask for a late check-out.",
            },
            {
              title: "Be at Hanoi station by 21:00",
              text: "The night train leaves at **21:45**.",
            },
          ],
        },
        {
          place: "Hue",
          tips: [
            {
              title: "Take a late start after the night train",
              text: "You arrive about **10:25**, so have breakfast and a nap, then see the citadel at **14:00**.",
            },
            {
              title: "Bring cash for the Hue tickets",
              text: "The Imperial City is **200,000 dong**, each tomb **150,000 dong**, and the combo with two tombs **420,000 dong** for two days. Prices can change, so check on the day.",
            },
          ],
        },
        {
          place: "Hoi An",
          tips: [
            {
              title: "Leave at 07:15 for a 10:00 flight",
              text: "Da Nang airport is about **30 km** away, **35 to 50 minutes**.",
            },
            {
              title: "Book several tailor fittings",
              text: "Very fast turnarounds cost quality.",
            },
          ],
        },
        {
          place: "Ho Chi Minh City",
          tips: [
            {
              title: "See the cathedral from outside",
              text: "Restoration of Notre-Dame is still running, so check at the door whether you can go in.",
              temporary: "Until the restoration ends",
            },
          ],
        },
        {
          place: "Phnom Penh",
          tips: [
            {
              title: "Start at the Royal Palace by 08:00",
              text: "It has two sessions: the morning one starts at about **08:00** and ends between **10:30 and 11:00**, and the afternoon one runs **14:00 to 17:00**. It closes on royal and public holidays.",
            },
          ],
        },
        {
          place: "Siem Reap",
          tips: [
            {
              title: "Buy the Angkor pass the afternoon before",
              text: "After **16:30** you can buy the next day's pass, and the gate opens at **05:00**.",
              link: { label: "Buy at angkorenterprise.gov.kh", href: "https://angkorenterprise.gov.kh" },
            },
            {
              title: "Reach Ta Prohm by 08:00",
              text: "Go before the tour coaches, and leave Bayon until later. Rest from **12:00 to 15:00**.",
            },
            {
              title: "Choose Kampong Phluk for the floating village",
              text: "It is a common alternative to the main Tonle Sap dock. Ask your hotel.",
            },
            {
              title: "Leave at 07:30 for an 11:00 flight",
              text: "The new airport is **40 to 50 km** out, **45 to 75 minutes** by road.",
            },
          ],
        },
        {
          place: "Bangkok",
          tips: [
            {
              title: "Cover up for the Grand Palace",
              text: "It costs **500 baht**, last tickets sell at about **15:30**, and shoulders and knees must be covered. Ignore anyone who says it is closed.",
            },
            {
              title: "Visit Chatuchak on a weekend",
              text: "The full market runs Saturday and Sunday, about **09:00 to 18:00**. Midweek only the plant section opens.",
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
          title: "Visit a travel clinic 8 weeks before",
          text: "Dengue occurs in all three countries, so use repellent by day.",
          link: { label: "Check vaccines at travelhealthpro.org.uk", href: "https://travelhealthpro.org.uk" },
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Cover shoulders and knees at temples",
          text: "This applies at Angkor, the Grand Palace and the royal tombs.",
        },
        {
          icon: "customs",
          title: "Speak quietly at Tuol Sleng and Choeung Ek",
          text: "Take no selfies.",
        },
        {
          icon: "weather",
          title: "Avoid Tet week",
          text: "Lunar New Year shuts shops and fills trains for about a week.",
        },
      ],
    },
  ],
};
