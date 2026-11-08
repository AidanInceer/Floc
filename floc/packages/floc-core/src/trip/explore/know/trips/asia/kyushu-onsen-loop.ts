import type { TripKnow } from "../../know-types";

export const KYUSHU_ONSEN_LOOP: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Japan", slug: "japan" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Book the Yufuin ryokan first",
          text: "Rooms with a private bath are few, so check dates early.",
        },
        {
          icon: "weather",
          title: "Go from November to May",
          text: "Typhoon season runs June to December, with the highest risk in southern Japan. October can still bring typhoons.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Bring your passport, not a visa",
          text: "UK passports get **90 days** on arrival with no visa.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "train",
          title: "Take the subway from the airport to Hakata",
          text: "It takes about **6 minutes** and costs **260 yen**.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry cash and coins",
          text: "Yatai, small baths and bus fares often need them.",
        },
        {
          icon: "food",
          title: "Ask the price before you order at a yatai",
          text: "Many show no menu. Eat at two or three stalls and do not stay long.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Reserve the Yufuin no Mori",
          text: "From Hakata it takes about **2h 15** and costs about **6,100 yen** one way. Every seat is reserved. About **3** run a day, so check the times.",
          link: { label: "See Yufuin no Mori times", href: "https://www.jrkyushu.co.jp/english/train/yufuin_no_mori.html" },
        },
        {
          icon: "car",
          title: "Take the bus from Hakata if you miss it",
          text: "It takes about **2 hours** from Tenjin and **2h 20** from Hakata Bus Terminal.",
        },
        {
          icon: "car",
          title: "Take the local bus from Yufuin to Beppu",
          text: "It takes about **50 minutes**, costs about **1,100 yen** and runs once or twice an hour, with no booking. Only one Yufuin no Mori a day runs on to Beppu.",
        },
        {
          icon: "train",
          title: "Plan the way back to Fukuoka",
          text: "The Sonic express to Hakata takes about **2 hours** and costs about **6,380 yen**. The highway bus takes **2 to 2h 45** and costs **3,250 yen**.",
        },
        {
          icon: "ticket",
          title: "Buy the Beppu bus pass first",
          text: "It costs **900 yen**, and its coupon takes **200 yen** off the combined hells ticket.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Fukuoka",
          tips: [
            {
              title: "Eat at yatai in Nakasu or Nagahama",
              text: "Go in the evening, and ask prices first.",
            },
          ],
        },
        {
          place: "Yufuin",
          tips: [
            {
              title: "Walk Yunotsubo Kaido early or after 16:00",
              text: "The street is packed with tour groups by day.",
            },
          ],
        },
        {
          place: "Beppu",
          tips: [
            {
              title: "Plan bus rides between the hells",
              text: "They open **08:00 to 17:00** and cost **450 yen** each, or **2,200 yen** for all eight. Yama-Jigoku is closed for good.",
            },
            {
              title: "Eat steamed food at Kannawa",
              text: "The hells are too hot to bathe in. Kannawa is a bus ride from the station.",
            },
            {
              title: "Try the Takegawara sand bath",
              text: "A sand bath plus hot bath costs **1,000 yen**, and it is open **06:30 to 22:30**. Wash first.",
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
          title: "Check trains the night before in typhoon season",
          text: "Typhoon season runs June to December.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Wash before you enter any bath",
          text: "Keep your hair out of the water.",
        },
        {
          icon: "customs",
          title: "Ask the ryokan about tattoos",
          text: "Some baths refuse them.",
        },
      ],
    },
  ],
};
