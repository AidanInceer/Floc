import type { TripKnow } from "../../know-types";

export const SYDNEY_AND_BLUE_MOUNTAINS: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Australia", slug: "australia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Pick September to November or March to May",
          text: "Summer is hot and wet, with bushfire risk from November to February.",
        },
        {
          icon: "ticket",
          title: "Book Scenic World and any bridge climb ahead",
          text: "Book a few weeks ahead in school holidays.",
        },
        {
          icon: "walk",
          title: "Check the Bondi to Coogee walk first",
          text: "A rockfall in August 2025 closed part of the coastal walk toward Bronte surf club. A detour is signed and there is no reopening date, so check the council pages the week you walk.",
          link: { label: "See the North Bronte works", href: "https://haveyoursay.waverley.nsw.gov.au/nth-bronte-cliff-remediation" },
          temporary: "Until the cliff works finish",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Apply for the free eVisitor before you fly",
          text: "A UK passport can use the free eVisitor, or the electronic travel authorisation app with a service fee of **A$20**.",
        },
        {
          icon: "customs",
          title: "Declare food, wood and farm contact",
          text: "Boots may be checked.",
        },
        {
          icon: "shield",
          title: "Buy travel insurance",
          text: "Urgent hospital care is free for UK visitors. Doctors and ambulances are not.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "train",
          title: "Take the airport train to the city",
          text: "It goes to Circular Quay or Central and adds a **A$18.61** station access fee.",
          link: { label: "See the airport train fares", href: "https://transportnsw.info/travel-info/airport-travel/getting-to-from-sydney-airport" },
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Tap a bank card on public transport",
          text: "You need no ticket. The adult daily cap is **A$19.30** Monday to Thursday and **A$9.65** Friday to Sunday and on public holidays.",
        },
        {
          icon: "ticket",
          title: "Check the Scenic World price",
          text: "A day pass is from **A$64**.",
          link: { label: "See Scenic World", href: "https://www.scenicworld.com.au" },
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Take the train to Katoomba",
          text: "From Central it takes about **90 minutes** on an express and up to **2 hours** on a stopping train. A car is not needed.",
        },
        {
          icon: "car",
          title: "Check the roads if you drive",
          text: "The Great Western Highway is closed between Mount Victoria and Hartley, with detours. Jenolan Caves Road is closed until late 2026.",
          temporary: "Until the roadworks end",
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
              title: "Allow 2 to 3 hours for Bondi to Coogee",
              text: "The walk is about **6 km** with stairs. Swim between the flags, as patrolled hours are posted on the beach.",
            },
            {
              title: "Use the ferry as your harbour cruise",
              text: "The Manly ferry costs a normal fare and the daily cap limits the total. Harbour cruises cost more for much the same view.",
            },
          ],
        },
        {
          place: "Katoomba",
          tips: [
            {
              title: "Go to Echo Point early",
              text: "The Three Sisters lookout gets busy later in the day. The Blue Mountains Explorer bus runs hourly from **09:00 to 17:00**.",
            },
            {
              title: "Go to Blackheath for the Grand Canyon track",
              text: "The track is a **6.3 km** loop, **3 to 4 hours**, grade 3. It starts near Blackheath, not Katoomba. The walk from the station to the car park is about **4.8 km**, so take a taxi.",
              link: { label: "See the Grand Canyon track", href: "https://www.nationalparks.nsw.gov.au/things-to-do/walking-tracks/grand-canyon-track" },
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
          title: "Stay out of canyons in rain",
          text: "Never walk a canyon before, during or after heavy rain. The Grand Canyon track can flood.",
        },
        {
          icon: "drop",
          title: "Swim between the flags",
          text: "Rip currents can form on any beach. Never dive into shallow water.",
        },
        {
          icon: "sun",
          title: "Cover up and carry water",
          text: "The sun is very strong. Mountain mornings are cold even in summer, so pack a layer.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Expect patchy signal on mountain tracks",
          text: "Coverage is good in Sydney.",
        },
      ],
    },
  ],
};
