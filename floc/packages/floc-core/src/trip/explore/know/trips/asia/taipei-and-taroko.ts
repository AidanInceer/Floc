import type { TripKnow } from "../../know-types";

export const TAIPEI_AND_TAROKO: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Taiwan", slug: "taiwan" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "walk",
          title: "Plan short walks, not the famous gorge trails",
          text: "Shakadang, Swallow Grotto, Tunnel of Nine Turns, Baiyang and Zhuilu are closed. Repairs at Shakadang, Swallow Grotto and Baiyang are not planned before **2031**.",
          temporary: "Until the closed trails reopen",
        },
        {
          icon: "walk",
          title: "Walk the Taroko trails that are open",
          text: "Tianxiang Path, Tabiduo and Xiangde Temple are open. Dekalun is sometimes shut for maintenance, and Dali has route limits. Check the park site the week before.",
        },
        {
          icon: "weather",
          title: "Go from October to December, or in March",
          text: "Typhoons are most active from July to September and ease from October. Taipei is damp from February to April.",
        },
        {
          icon: "train",
          title: "Book the Hualien train early at busy times",
          text: "Seats open **28 days** ahead.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Bring your passport, not a visa",
          text: "UK passports get **90 days** visa-free. Your passport needs **6 months** left after you arrive.",
        },
        {
          icon: "passport",
          title: "Fill in the Taiwan Arrival Card",
          text: "Do it online within **3 days** before you land.",
        },
        {
          icon: "shield",
          title: "Get travel insurance",
          text: "The UK has limited consular help in Taiwan.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "train",
          title: "Take the airport metro express to Taipei Main",
          text: "It takes **38 minutes** and costs **160 New Taiwan dollars**, or **150** with an EasyCard. It runs **06:00 to 23:00**.",
        },
        {
          icon: "pin",
          title: "Give taxis the Taoyuan airport name",
          text: "Do not confuse Taoyuan with Songshan airport when you give an address.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Buy an EasyCard",
          text: "It costs **500 New Taiwan dollars**: **400** credit plus a **100** card fee. Metro fares drop **20%**.",
        },
        {
          icon: "money",
          title: "Carry coins for top-up machines",
          text: "They take no notes over **500 New Taiwan dollars** and give no change.",
        },
        {
          icon: "money",
          title: "Carry cash for night markets",
          text: "Cards work in many places, but not at the stalls.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Take a Puyuma or Tze-Chiang train to Hualien",
          text: "It takes about **2 to 3 hours** and costs **583 New Taiwan dollars**. Slower trains take up to **3.5 hours**.",
        },
        {
          icon: "car",
          title: "Book a car or taxi to Tianxiang",
          text: "Bus 310 runs from Hualien station to the Taroko visitor centre, and bus 302 from Xincheng. No regular bus runs on from there.",
        },
        {
          icon: "car",
          title: "Check the road notice for Highway 8",
          text: "It runs on timed traffic windows that the park changes about monthly, with night closures.",
        },
        {
          icon: "car",
          title: "Bring the right papers to rent a scooter",
          text: "A UK licence plus an international driving permit with the motorcycle category, bought before you leave. Scooters cost about **400 New Taiwan dollars** a day; confirm with the shop.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Taipei",
          tips: [
            {
              title: "Try Raohe night market for the food",
              text: "It is by Songshan station. Shilin is the famous one, and locals call it touristy.",
            },
            {
              title: "Wash before you enter a Beitou bath",
              text: "Private rooms need at least two people. Public baths ban swimwear in the bathing pools, though some mixed pools require it.",
            },
          ],
        },
        {
          place: "Hualien",
          tips: [
            {
              title: "Go to Dongdamen night market in the evening",
              text: "It runs **18:00 to midnight**.",
            },
            {
              title: "Start the Taroko trails early",
              text: "Afternoon rain often starts early.",
            },
          ],
        },
      ],
    },
    {
      stage: "Staying well",
      tips: [
        {
          icon: "weather",
          title: "Avoid the gorge in or after heavy rain",
          text: "Typhoons can hit from June. Do not enter the river, as the water is swift after rain.",
        },
        {
          icon: "shield",
          title: "Make noise on trails",
          text: "It warns snakes you are coming.",
        },
      ],
    },
  ],
};
