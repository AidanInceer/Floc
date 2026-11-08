import type { TripKnow } from "../../know-types";

export const GREAT_OCEAN_ROAD_AND_ULURU: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Australia", slug: "australia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Travel in April, May, September or October",
          text: "Uluru is hot from November to March, and the Kata Tjuta walk closes in the heat. Fire risk peaks from November to February.",
        },
        {
          icon: "ticket",
          title: "Book a free Twelve Apostles slot",
          text: "From 16 October 2026 the visitor precinct needs a booking that includes parking. It is free until April 2027, and a fee follows.",
          link: { label: "Book on the Great Ocean Road Authority site", href: "https://www.greatoceanroadauthority.vic.gov.au/Projects/Twelve-Apostles-Visitor-Centre" },
        },
        {
          icon: "ticket",
          title: "Book the Uluru beds months ahead",
          text: "Ayers Rock Resort has the only beds near Uluru and they sell out first.",
        },
        {
          icon: "plane",
          title: "Expect a change of planes for Uluru",
          text: "Flights from Adelaide to Uluru change planes in Sydney or Melbourne. Plan only a sunset on the day you arrive.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Apply for the free eVisitor before you fly",
          text: "A UK passport can use the free eVisitor, or the electronic travel authorisation app, which may add a service fee of about **A$20**.",
        },
        {
          icon: "car",
          title: "Check your licence",
          text: "A UK photocard licence is accepted for visits. A paper licence may need updating.",
        },
        {
          icon: "shield",
          title: "Buy travel insurance",
          text: "Urgent hospital care is covered, but ambulances and medical evacuation are not.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "ticket",
          title: "Buy the Uluru park pass online first",
          text: "A 3-day pass is **A$38** for an adult. An annual pass is **A$50**. Under 18s go free.",
          link: { label: "Buy a pass", href: "https://uluru.gov.au/plan/passes/" },
        },
        {
          icon: "money",
          title: "Buy supplies in Adelaide",
          text: "Uluru costs more than the cities for food, fuel and tours. Cards work almost everywhere; carry a little cash for market stalls.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire a one-way car, drive on the left",
          text: "Ask about the one-way drop-off fee when you book. Keep the car until the flight day and return it at Adelaide airport.",
        },
        {
          icon: "car",
          title: "Avoid driving after dark",
          text: "Kangaroos move at dusk and dawn.",
        },
        {
          icon: "car",
          title: "Stay off unsealed tracks",
          text: "Hire insurance often excludes them. Northern Territory police ask tourists to avoid unsealed tracks in Central Australia. Carry water and tell someone your plan.",
        },
        {
          icon: "weather",
          title: "Read the time zone on your tickets",
          text: "Uluru is **1 hour 30** behind Sydney in daylight saving.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Melbourne",
          tips: [
            {
              title: "Book a free penguin ticket",
              text: "Viewing at St Kilda is on a ticketed boardwalk after dark. Tickets for the next week release on Tuesdays at **10:00** Melbourne time.",
              link: { label: "Book on the St Kilda Penguins site", href: "https://www.stkildapenguins.com.au/" },
            },
            {
              title: "Skip Queen Victoria Market on Monday and Wednesday",
              text: "It is closed on those days.",
              link: { label: "See the market hours", href: "https://qvm.com.au/visit/opening-hours/" },
            },
          ],
        },
        {
          place: "Port Campbell",
          tips: [
            {
              title: "Check the sunset time at the Apostles",
              text: "Sunset from November to February is about **20:00 to 20:30**. Gibson Steps and Loch Ard Gorge are free and unchanged.",
            },
          ],
        },
        {
          place: "Grampians",
          tips: [
            {
              title: "Check park closures before you go",
              text: "The Brambuk cultural centre is closed for refurbishment in 2026, though the information centre is open. Mackenzie Falls is closed to the end of 2026. Boroka Lookout, Reeds Lookout and the Balconies are open.",
              link: { label: "Check Grampians closures", href: "https://www.parks.vic.gov.au/places-to-see/parks/grampians-national-park" },
              temporary: "Until the works end",
            },
            {
              title: "Allow for road closures",
              text: "Syphon Road is closed until further notice. Lodge Road is closed between Rose Creek Road and Red Rock Road until 8 December 2026.",
              temporary: "Until the roads reopen",
            },
          ],
        },
        {
          place: "Adelaide",
          tips: [
            {
              title: "Eat at the Central Market in the day",
              text: "It closes on Sunday and Monday. Only Friday evening works for dinner, when it is open until **21:00**.",
            },
            {
              title: "Use a driver or tour for the Barossa",
              text: "Hold the car until the flight day.",
            },
          ],
        },
        {
          place: "Uluru",
          tips: [
            {
              title: "Walk Kata Tjuta at first light",
              text: "The Valley of the Winds is **7.4 km**, **3 to 4 hours**. From **11:00** it closes at Karu Lookout when the temperature is **36 degrees Celsius** or more.",
              link: { label: "See the Valley of the Winds walk", href: "https://uluru.gov.au/do/walks/valley-of-the-winds" },
            },
            {
              title: "Do the base walk on a cool morning",
              text: "The Uluru base walk is **10.6 km**, about **3 hours 30**. Finish by **11:00** in hot weather.",
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
          title: "Wear a hat, sleeves and a fly net",
          text: "The sun is strong at Uluru and flies are many.",
        },
        {
          icon: "weather",
          title: "Install the fire alert apps",
          text: "Fire risk peaks from November to February. Install the official fire alert app for Victoria and for South Australia.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Do not climb Uluru or fly a drone",
          text: "The Anangu people ask visitors not to climb, and the climb is closed. Drones are banned. Follow the signs on photography of sacred sites.",
        },
        {
          icon: "chat",
          title: "Learn a few local words",
          text: "\"G'day\" is hello, \"arvo\" is afternoon and \"servo\" is a petrol station.",
        },
      ],
    },
  ],
};
