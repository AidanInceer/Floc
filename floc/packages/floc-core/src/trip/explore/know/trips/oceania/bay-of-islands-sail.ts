import type { TripKnow } from "../../know-types";

export const BAY_OF_ISLANDS_SAIL: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "New Zealand", slug: "new-zealand" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "boat",
          title: "Book a skippered yacht months ahead",
          text: "Pick the boat and the price early for December to February. One overnight listing starts at about **1,400 New Zealand dollars** for the boat, for up to 6 people. Check that the price covers food, fuel and the skipper.",
        },
        {
          icon: "weather",
          title: "Keep one spare day",
          text: "Boat days can cancel for wind or swell.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Apply for the travel authorisation",
          text: "A UK passport needs a New Zealand electronic travel authorisation: **17 New Zealand dollars** in the app or **23 New Zealand dollars** online. Allow **72 hours**.",
          link: { label: "Apply on the Immigration New Zealand site", href: "https://www.immigration.govt.nz/new-zealand-visas/visas/visa/nzeta" },
        },
        {
          icon: "money",
          title: "Pay the visitor levy with it",
          text: "The international visitor levy is **100 New Zealand dollars**. You can stay for **6 months**.",
        },
        {
          icon: "customs",
          title: "Fill in the free traveller declaration",
          text: "File it no earlier than **24 hours** before your flight.",
        },
        {
          icon: "shield",
          title: "Check your insurance covers sailing",
          text: "Ask your insurer before you book the yacht.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Drive north from Auckland",
          text: "Paihia is about **240 km** and **3 hours 35** from Auckland. Thieves target hire cars, so leave nothing in view.",
        },
        {
          icon: "customs",
          title: "Declare food and used outdoor gear",
          text: "Clean your boots before you land.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "ticket",
          title: "Budget for Waitangi",
          text: "The ticket is **78 New Zealand dollars** for overseas adults from 1 October 2026 and lasts 2 days. It covers a tour of about **50 minutes**, a cultural experience of about **30 minutes** and two museums.",
          link: { label: "See Waitangi prices", href: "https://www.waitangi.org.nz/book/waitangi-admissions" },
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "boat",
          title: "Take the small ferry to Russell",
          text: "The passenger ferry from Paihia takes about **15 minutes**, and an adult return is **19.40 New Zealand dollars**.",
          link: { label: "See the ferry", href: "https://northlandferries.co.nz/bay-of-islands-ferry" },
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Paihia",
          tips: [
            {
              title: "Split the Waitangi ticket over two days",
              text: "Do the tour and show on day one and the museums on day two. It is open every day except 25 December.",
            },
          ],
        },
        {
          place: "Bay of Islands",
          tips: [
            {
              title: "Expect the Hole in the Rock to cancel",
              text: "The passage depends on swell, and cruises cancel for safety. A day cruise takes about **4.5 to 5 hours**.",
            },
            {
              title: "Wear a lifejacket when the skipper asks",
              text: "The skipper sets the route and the plan for the day.",
            },
          ],
        },
      ],
    },
    {
      stage: "Staying well",
      tips: [
        {
          icon: "sun",
          title: "Bring a hat and seasickness tablets",
          text: "The sun on the water is strong.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Take your shoes off at a meeting house",
          text: "Ask before you film.",
        },
      ],
    },
  ],
};
