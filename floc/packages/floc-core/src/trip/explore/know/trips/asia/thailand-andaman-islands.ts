import type { TripKnow } from "../../know-types";

export const THAILAND_ANDAMAN_ISLANDS: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Thailand", slug: "thailand" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "shield",
          title: "Read the UK government's Thailand warnings",
          text: "It advises against all but essential travel within **20 km** of the Cambodia border, in Pattani, Yala and Narathiwat, in four districts of southern Songkhla, and on the Hat Yai to Padang Besar train line. This route stays outside those areas.",
        },
        {
          icon: "weather",
          title: "Check the flood news before you fly",
          text: "Bangkok has had severe flooding. Check the UK government's advice before you fly.",
        },
        {
          icon: "train",
          title: "Book the sleeper train early",
          text: "Booking opens up to **6 months** ahead, and sleepers sell out near New Year and Songkran.",
        },
        {
          icon: "weather",
          title: "Go from November to February",
          text: "Chiang Mai is smoky from February to April. The Andaman sea is calmest from December to March, and November can still be wet.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Count on 30 days visa-free",
          text: "UK passports get **30 days** visa-free, down from **60** since 15 September 2026. Your passport needs **6 months** left.",
        },
        {
          icon: "passport",
          title: "Fill in the Thai Digital Arrival Card",
          text: "It is free. Complete it online within **3 days** before you arrive.",
        },
        {
          icon: "passport",
          title: "Keep funds and an onward ticket ready",
          text: "You can be asked to show **10,000 baht** and proof of onward travel.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "train",
          title: "Take the airport rail link to Phaya Thai",
          text: "It takes about **27 minutes** and costs **45 baht**. From there the metro and a river boat reach the river. Use the official taxi queue, not touts.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Expect a fee on every cash withdrawal",
          text: "It is **220 to 250 baht**, up to **350 baht** on some cards. AEON machines are cheaper, about **150 baht**, and the screen shows the fee first.",
        },
        {
          icon: "car",
          title: "Use Grab or a meter, not station tuk-tuks",
          text: "Tuk-tuks at stations quote **100 to 200 baht**.",
        },
        {
          icon: "money",
          title: "Carry cash for markets and boats",
          text: "Use cards in hotels.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Take train 9 north from Krung Thep Aphiwat",
          text: "It leaves at **18:40** and arrives about **07:15**. Train 13 at **20:05** is the fallback. The station is far north, so take the metro to Bang Sue or a taxi.",
        },
        {
          icon: "plane",
          title: "Fly from Chiang Mai to Krabi",
          text: "There are about **3** flights a day, taking around **2 hours**. From Ao Nang a long-tail boat reaches Railay, and you may wade to board.",
        },
        {
          icon: "boat",
          title: "Check island boats the evening before",
          text: "Ferries to Phi Phi and Lanta run one or two times a day, mainly November to April. Boats cancel in rough weather, so keep a spare day.",
        },
        {
          icon: "car",
          title: "Pre-book the minivan home",
          text: "Leave Lanta by **07:30**. The minivan takes **2 to 4 hours** with stops, and afternoon car ferry queues can last **2 to 3 hours**.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Bangkok",
          tips: [
            {
              title: "Cover up for the Grand Palace",
              text: "It opens **08:30**, last tickets are at **15:30**, and it costs **500 baht**. Ignore anyone who says it is closed.",
              link: { label: "Check hours at royalgrandpalace.th", href: "https://royalgrandpalace.th" },
            },
            {
              title: "Go to Wat Arun earlier in the afternoon",
              text: "Take the cross-river ferry. Last entry is not confirmed, so do not leave it until **17:30**.",
            },
          ],
        },
        {
          place: "Chiang Mai",
          tips: [
            {
              title: "Leave bags when you arrive at 07:15",
              text: "Rooms are not ready before noon. The walking street runs on Sundays only.",
            },
            {
              title: "Pick an elephant sanctuary with no riding",
              text: "Choose one with no chaining. Prices are usually **1,500 to 3,500 baht**.",
            },
          ],
        },
        {
          place: "Railay",
          tips: [
            {
              title: "Book a long-tail for the four islands",
              text: "It costs about **1,000 baht**, plus park fees.",
            },
          ],
        },
        {
          place: "Koh Phi Phi",
          tips: [
            {
              title: "Ask about Maya Bay at the pier",
              text: "Swimming is banned, visits last one hour, and the fee is about **400 baht**. Go before **08:00** or after **15:00**.",
            },
          ],
        },
        {
          place: "Koh Lanta",
          tips: [
            {
              title: "Take a songthaew or taxi to the national park",
              text: "Roads are rough in rain, and insurance may not cover unlicensed riders. Do not hire a scooter if you have not ridden.",
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
          title: "Keep away from monkeys at Railay and Phi Phi",
          text: "They bite and rabies is possible. Seek care for any bite.",
        },
        {
          icon: "sun",
          title: "Use mineral sunscreen",
          text: "Sunscreens with oxybenzone and similar chemicals are banned in Thai marine parks.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Cover knees and shoulders at temples",
          text: "Take shoes off in temple halls and never touch a head.",
        },
        {
          icon: "chat",
          title: "Say khop khun",
          text: "It means thank you.",
        },
      ],
    },
  ],
};
