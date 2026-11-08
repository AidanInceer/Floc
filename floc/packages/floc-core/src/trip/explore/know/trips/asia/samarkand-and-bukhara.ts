import type { TripKnow } from "../../know-types";

export const SAMARKAND_AND_BUKHARA: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Uzbekistan", slug: "uzbekistan" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "plane",
          title: "Fly into Tashkent",
          text: "Samarkand airport has flights to Istanbul and Moscow, but none to London. Take the fast Afrosiyob train on to Samarkand, about **2 to 3 hours**.",
        },
        {
          icon: "weather",
          title: "Go in late April, May, September or October",
          text: "April to May and September to October bring frequent rain and wind. Avoid July and August: July highs reach **37°C**, and winter is cold.",
        },
        {
          icon: "train",
          title: "Book Afrosiyob trains early",
          text: "Tickets sell out and go on sale **45 to 30 days** ahead. Book at least a couple of weeks ahead in high season.",
          link: { label: "Book at e-ticket.railway.uz", href: "https://e-ticket.railway.uz/en/home" },
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Bring your passport, not a visa",
          text: "UK passports get **30 days** visa-free. Your passport needs **3 months** left after you arrive.",
        },
        {
          icon: "passport",
          title: "Register within 3 days of arrival",
          text: "Hotels do it and give you a slip. Keep every slip.",
        },
        {
          icon: "plane",
          title: "Check your flights for disruption",
          text: "The UK government notes Middle East flight disruption.",
          temporary: "Until the airspace closures end",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Change money at official offices only",
          text: "Black-market change is illegal. Booths reject damaged notes and US dollars issued before **2013**.",
        },
        {
          icon: "money",
          title: "Withdraw cash in Samarkand or Tashkent",
          text: "Few cash machines outside big cities take foreign cards.",
        },
        {
          icon: "ticket",
          title: "Budget for the Registan and Shah-i-Zinda",
          text: "The Registan is about **100,000 som** and Shah-i-Zinda about **80,000 som**. Check at the ticket office.",
        },
        {
          icon: "money",
          title: "Ask about the Bukhara tourist tax",
          text: "Some hotels add about **US$4** a night. Ask if it is in the price.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Take the Afrosiyob to Bukhara",
          text: "The fast Afrosiyob train takes about **1.5 to 2 hours**; check the railway site for your day. Bukhara station is in Kogon, about **15 km** from the city, so plan a taxi.",
        },
        {
          icon: "car",
          title: "Use Yandex Go for taxis",
          text: "Hotel-arranged cars cost more. Agree a fare before any unmetered ride.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Samarkand",
          tips: [
            {
              title: "See the Registan at sunset",
              text: "From November to March it is open **09:00 to 20:00**, and from April to October **08:00 to 23:00**.",
            },
            {
              title: "Eat plov at Joni Osh before 14:00",
              text: "It opens at **11:00** and sells out. A half portion with salad and bread is about **70,000 som**.",
            },
            {
              title: "Skip Siyob Bazaar on Mondays",
              text: "It is closed that day.",
            },
          ],
        },
        {
          place: "Bukhara",
          tips: [
            {
              title: "Walk the old town",
              text: "Lyab-i Hauz, the Kalyan minaret and the Ark are on foot. Cobbles and heat call for flat shoes.",
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
          title: "Insure with evacuation cover",
          text: "Medical care is poor and hospitals badly equipped outside the cities.",
        },
        {
          icon: "health",
          title: "Drink bottled water",
          text: "Stick to bottled water.",
        },
        {
          icon: "health",
          title: "Pack a mask for the winter air",
          text: "Air quality is poor from November to February, mainly in Tashkent. Carry a mask if you have asthma.",
        },
        {
          icon: "shield",
          title: "Carry your passport",
          text: "Police may ask for it.",
        },
        {
          icon: "shield",
          title: "Ask before photos near officials",
          text: "Photography near government buildings, airports and metro stations can upset police.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Cover shoulders and knees at mosques and shrines",
          text: "Dress modestly at every religious site.",
        },
        {
          icon: "customs",
          title: "Keep public affection private",
          text: "Public affection is frowned on, and same-sex relationships are illegal.",
        },
        {
          icon: "chat",
          title: "Say rahmat and greet elders first",
          text: "Rahmat means thank you. Bargain gently in markets.",
        },
      ],
    },
  ],
};
