import type { TripKnow } from "../../know-types";

export const SYDNEY_TO_CAIRNS: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Australia", slug: "australia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Travel in September or October",
          text: "These are the clearest months. April, May and November work with stinger suits. December to March is hot and wet in the north, and cyclone season runs November to April.",
        },
        {
          icon: "ticket",
          title: "Book the reef, Whitehaven and K'gari tours early",
          text: "They sell out in school holidays, from late December to January.",
        },
        {
          icon: "plane",
          title: "Route Noosa to Airlie Beach through Brisbane",
          text: "No airline flies direct from the Sunshine Coast. Drive Noosa to Brisbane Airport (about **2 hours**), fly to Proserpine (about **1 hour 45**) and transfer to Airlie Beach (about **30 minutes**). That makes four flights in all.",
        },
        {
          icon: "plane",
          title: "Check Airlie Beach to Cairns flight days",
          text: "The direct flight takes about **1 hour 30** and does not run every day. Check the days first, or fly by way of Brisbane, and plan your leaving day around the real schedule.",
        },
        {
          icon: "train",
          title: "Check the Kuranda closure dates",
          text: "The scenic railway cancels all services from 2 to 8 November 2026 and on 25 December. The Skyrail cable car closes on 8 and 9 December and on 25 December.",
          link: { label: "Check the Skyrail notices", href: "https://www.skyrail.com.au/visitor-information/notices" },
          temporary: "Until the closures end",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Apply for the free eVisitor before you fly",
          text: "A UK passport can use the free eVisitor, or the electronic travel authorisation app with a service fee of **A$20**. Third-party sites charge more for the same thing.",
        },
        {
          icon: "customs",
          title: "Fill in the passenger card",
          text: "Declare food, wood and recent farm contact.",
        },
        {
          icon: "shield",
          title: "Buy travel insurance",
          text: "Urgent hospital care is free for UK visitors. Doctors, ambulances and evacuation are not.",
        },
        {
          icon: "plane",
          title: "Book flights into Sydney and out of Cairns",
          text: "The flight from the UK takes **22 to 24 hours** with one stop.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Pay by card, tipping is not expected",
          text: "Cards work almost everywhere. Round up in restaurants.",
        },
        {
          icon: "ticket",
          title: "Check the reef charge is in the fare",
          text: "The charge is **A$8.50** a day, or **A$4.25** for part of a day, since 1 April 2026.",
        },
        {
          icon: "train",
          title: "Expect an airport train station fee",
          text: "The airport train adds an **A$18.61** station fee to the fare. Elsewhere in Sydney, tap a bank card on trains and ferries.",
          link: { label: "See the airport train fares", href: "https://transportnsw.info/travel-info/airport-travel/getting-to-from-sydney-airport" },
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "plane",
          title: "Fly to Ballina for Byron Bay",
          text: "The flight from Sydney takes about **1 hour 20**, then it is about **30 minutes** by car to Byron Bay.",
        },
        {
          icon: "car",
          title: "Allow 4 hours from Byron Bay to Noosa",
          text: "The drive is about **3 hours 30**, but Brisbane traffic adds time. Drive on the left. Hire firms bill tolls around Brisbane.",
        },
        {
          icon: "weather",
          title: "Set your clock back an hour in Queensland",
          text: "New South Wales is one hour ahead of Queensland from October to early April. Flight and tour times use local time.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Sydney",
          tips: [
            {
              title: "Go to the Blue Mountains by express train",
              text: "The express takes about **90 minutes** and stopping trains up to **2 hours**. Scenic World opens **10:00 to 16:00** on weekdays and **09:00 to 17:00** at weekends.",
            },
          ],
        },
        {
          place: "Byron Bay",
          tips: [
            {
              title: "Walk up to Cape Byron in the dark",
              text: "Sunrise in mid-November is about **05:40**. Start about **04:45** with a head torch. Parking at the lighthouse is **A$10** an hour, with a limit of 1 hour a day.",
            },
            {
              title: "Check park alerts before Minyon Falls",
              text: "Check the Nightcap National Park alerts first. Nobody may enter within **100 m** of the top of the falls, and the park may close.",
            },
          ],
        },
        {
          place: "Noosa",
          tips: [
            {
              title: "Take a guided tour to K'gari",
              text: "Pick-ups start about **05:20** and the tour returns about **19:00**. A self-drive on the beach limits you to **80 km/h**, with no night driving.",
            },
          ],
        },
        {
          place: "Airlie Beach",
          tips: [
            {
              title: "Pick a licensed small boat for Whitehaven",
              text: "The cheapest big-boat deals run crowded days. Ask the operator when they reach Hill Inlet and go with their timing.",
            },
          ],
        },
        {
          place: "Cairns",
          tips: [
            {
              title: "Tour the Daintree in a small group",
              text: "Cairns to Cape Tribulation is about **2.5 hours** each way, so a day trip is **10 to 11 hours** plus the ferry. A small-group tour or a stay in Port Douglas is easier.",
            },
            {
              title: "Take the 09:30 train to Kuranda",
              text: "There is no 09:00 train. The railway leaves Cairns at **08:45** and **09:30**, and returns from Kuranda at **14:45** and **15:30**. Check the live timetable.",
              link: { label: "See the railway timetable", href: "https://www.ksr.com.au/Pages/Timetables.aspx" },
            },
            {
              title: "Confirm your reef boat time",
              text: "Cairns boat times vary by operator. The Quicksilver boat from Port Douglas leaves at **10:00** and returns at **16:30**.",
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
          title: "Wear a stinger suit from November to May",
          text: "Some operators start in late October, and stings can happen at any time. Boats lend suits. Check the Surf Life Saving Queensland stinger update for net status.",
        },
        {
          icon: "drop",
          title: "Swim between the flags",
          text: "Rip currents are the main beach risk.",
        },
        {
          icon: "shield",
          title: "Keep out of the water where crocodiles live",
          text: "Do not swim or wade in Daintree creeks or beaches.",
        },
        {
          icon: "walk",
          title: "Keep children within arm's reach on K'gari",
          text: "Dingoes live there.",
        },
        {
          icon: "sun",
          title: "Cover up against strong sun",
          text: "The sun is extreme in summer and skin burns fast even when it is cool.",
        },
        {
          icon: "weather",
          title: "Watch the bushfire risk in New South Wales",
          text: "It is highest from November to February.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Buy a digital SIM card before you land",
          text: "A digital SIM card (eSIM) is a phone plan you set up on your phone with no plastic card. Coverage is patchy in the Daintree.",
        },
      ],
    },
  ],
};
