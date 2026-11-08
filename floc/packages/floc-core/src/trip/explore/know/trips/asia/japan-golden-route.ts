import type { TripKnow } from "../../know-types";

export const JAPAN_GOLDEN_ROUTE: TripKnow = {
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
          title: "Book the ryokan, teamLab and Shibuya Sky first",
          text: "These sell out, so lock them in before the rest of the trip.",
        },
        {
          icon: "train",
          title: "Add up train fares before you buy a rail pass",
          text: "Hakone is not on the Japan Rail Pass, and the 7-day pass costs **53,000 yen** since 1 October 2026. Price the three long bullet train rides at single fares first; the fastest trains (Nozomi and Mizuho) need a supplement.",
        },
        {
          icon: "weather",
          title: "Check trains the night before in typhoon season",
          text: "Typhoon season runs from June to December.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Bring your passport, not a visa",
          text: "UK passports get **90 days** on arrival with no visa. Your passport must be valid for your stay and have one blank page.",
        },
        {
          icon: "passport",
          title: "Fill in Visit Japan Web before you land",
          text: "It is optional but faster at the border, and it handles the new tax-free exit step.",
        },
        {
          icon: "health",
          title: "Check your medicines are allowed",
          text: "Some common medicines are illegal in Japan. Ask the Japanese embassy about yours before you pack.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly into Haneda and out of Kansai",
          text: "A ticket into one airport and out of another saves doubling back between Tokyo and Osaka.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry cash",
          text: "Many small places and shrines take cards badly.",
        },
        {
          icon: "ticket",
          title: "Expect a Kyoto hotel tax",
          text: "Since 1 March 2026 Kyoto adds **200 to 10,000 yen** per person per night, set by room price.",
        },
        {
          icon: "money",
          title: "Expect a 3,000 yen departure tax",
          text: "It has been **3,000 yen** since 1 July 2026 and is added to your ticket price.",
        },
        {
          icon: "ticket",
          title: "Claim tax-free refunds when you leave",
          text: "Since 1 November 2026 you pay full price and claim back later. Spend **5,000 yen** or more at one shop in one day, keep the items, and finish the exit step before check-in.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Reserve a seat for big bags",
          text: "Bags over **160 cm** (three sides added) need a reserved seat with a bag area, or a **1,000 yen** fee. Over **250 cm** is not allowed.",
          link: { label: "Read the oversized baggage rule", href: "https://global.jr-central.co.jp/en/info/oversized-baggage/" },
        },
        {
          icon: "ticket",
          title: "Buy the Hakone Freepass",
          text: "It costs **7,100 yen** for 2 days from Shinjuku and covers Hakone's trains, buses and boats.",
          link: { label: "See Odakyu passes", href: "https://odakyu-global.com/passes/" },
        },
        {
          icon: "train",
          title: "Reserve the Romancecar seat early",
          text: "The Shinjuku to Hakone-Yumoto express needs a reserved seat, with a surcharge of **1,200 yen**.",
        },
        {
          icon: "pin",
          title: "Send big bags ahead to Kyoto",
          text: "A courier can take them from Tokyo to your Kyoto hotel while you stay in Hakone.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Tokyo",
          tips: [
            {
              title: "Check Tsukiji market before you go",
              text: "The outer market is closed on Sundays, public holidays and some Wednesdays. Most shops finish by about **14:00**.",
            },
            {
              title: "Check each Ueno museum's closed day",
              text: "Closed days differ from museum to museum.",
            },
          ],
        },
        {
          place: "Hakone",
          tips: [
            {
              title: "Plan for buses on the ropeway",
              text: "Buses replace Owakudani to Sounzan on 7 to 24 December 2026 and Togendai to Owakudani on 12 January to 26 February 2027.",
              temporary: "Until 26 February 2027",
            },
            {
              title: "Leave slack after the lake boat",
              text: "Boat and ropeway stop in fog, wind or volcanic gas, and the bus on to Odawara takes about **50 minutes**. Book a train after **14:00**.",
              link: { label: "Check Hakone Navi that morning", href: "https://www.hakonenavi.jp/international/en/" },
            },
          ],
        },
        {
          place: "Kyoto",
          tips: [
            {
              title: "Visit Kinkaku-ji at opening on another day",
              text: "It is in north-west Kyoto, far from the station, and opens at about **09:00**. Do not squeeze it in on the day you leave.",
            },
            {
              title: "Take a day trip to Nara",
              text: "The train takes about **45 minutes**, and the deer park is free to enter.",
            },
          ],
        },
        {
          place: "Hiroshima",
          tips: [
            {
              title: "Book early or late Peace Museum slots",
              text: "From September to November it is open **07:30 to 19:00** for **200 yen**, and the early and late slots need an online booking.",
              link: { label: "Book at the museum site", href: "https://hpmmuseum.jp/?lang=eng" },
            },
            {
              title: "Time Miyajima to the tide",
              text: "The gate looks afloat only near high tide, which moves about **50 minutes** later each day. Use the official tide table.",
              link: { label: "See the Miyajima tide table", href: "https://www.miyajima.or.jp" },
            },
            {
              title: "Pay the Miyajima visitor tax",
              text: "It is **100 yen**, and rail pass holders buy a separate ticket for it at the terminal.",
            },
          ],
        },
        {
          place: "Osaka",
          tips: [
            {
              title: "Leave early for the airport",
              text: "The Haruka airport train from Shin-Osaka takes about **50 minutes**. Allow more than the plan says for an international flight.",
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
          title: "Check menu prices before you sit down",
          text: "The UK government warns of drink spiking and street touts in Kabukicho, Roppongi and Shibuya. Do not follow touts.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Ask before using a hot spring bath",
          text: "Some baths refuse tattoos. Ask first or book a private bath.",
        },
        {
          icon: "customs",
          title: "Take your shoes off indoors",
          text: "Do this in the ryokan and in some restaurants. There is no tipping.",
        },
        {
          icon: "food",
          title: "Keep your rubbish with you",
          text: "Bins are rare, and eating while walking in busy streets is frowned on.",
        },
      ],
    },
  ],
};
