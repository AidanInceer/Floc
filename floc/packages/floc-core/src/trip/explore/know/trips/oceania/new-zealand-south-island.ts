import type { TripKnow } from "../../know-types";

export const NEW_ZEALAND_SOUTH_ISLAND: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "New Zealand", slug: "new-zealand" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Book the big days before you fly",
          text: "The stargazing tour, the Milford Sound cruise and any glacier helicopter hike sell out in peak summer. Book the train over Arthur's Pass once the full service runs again.",
        },
        {
          icon: "walk",
          title: "Walk Roys Peak outside the lambing closure",
          text: "The track closes each year for lambing, from 1 October to **10 November**. Isthmus Peak or Mount Iron are the walks to do while it is closed.",
          link: { label: "Check the track on the Department of Conservation site", href: "https://www.doc.govt.nz/parks-and-recreation/places-to-go/otago/places/wanaka-area/things-to-do/roys-peak-track/" },
        },
        {
          icon: "train",
          title: "Expect a bus on the train ride",
          text: "Until **20 November** the train runs only from Christchurch to Arthur's Pass, with a bus on to Greymouth. Check the service and the times before you book.",
          link: { label: "Check the train on Great Journeys New Zealand", href: "https://www.greatjourneysnz.com/tours-and-trains/scenic-trains/tranzalpine-train/" },
          temporary: "Until the full train service returns",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Apply for the travel authorisation",
          text: "A UK passport needs a New Zealand electronic travel authorisation: **17 New Zealand dollars** in the app or **23 New Zealand dollars** online. Apply at least **72 hours** ahead.",
          link: { label: "Apply on the Immigration New Zealand site", href: "https://www.immigration.govt.nz/visas/new-zealand-electronic-travel-authority-nzeta/" },
        },
        {
          icon: "money",
          title: "Pay the visitor levy with it",
          text: "The international visitor levy is **100 New Zealand dollars**, paid together with the travel authorisation.",
        },
        {
          icon: "passport",
          title: "Check your passport and onward ticket",
          text: "The passport must last **3 months** past the day you leave. You need a return or onward ticket and enough money to show at the border.",
        },
        {
          icon: "customs",
          title: "Fill in the free traveller declaration",
          text: "Do it up to **24 hours** before you fly.",
        },
        {
          icon: "shield",
          title: "Buy travel insurance for hiking and helicopters",
          text: "UK visitors get urgent care only, not routine care. Pick cover that includes hiking, helicopters and evacuation.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Keep the first night easy",
          text: "Most flights from the UK change planes, for example in Singapore, Dubai or Auckland. Expect to be tired when you land in Christchurch.",
        },
        {
          icon: "car",
          title: "Book the hire car or van ahead",
          text: "A one-way hire costs extra and not every firm lets you drop off in Greymouth. Ask about the fee before you book.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Pay by card, carry a little cash",
          text: "Cards work almost everywhere. Keep some cash for small remote cafes.",
        },
        {
          icon: "ticket",
          title: "Pay for Aoraki parking by card",
          text: "The White Horse Hill car park costs **25 New Zealand dollars** a day, card only.",
          link: { label: "See the Hooker Valley track page", href: "https://www.doc.govt.nz/hooker-valley-track" },
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Drive on the left",
          text: "A UK photocard licence is valid for up to **18 months**. Holders of an old paper licence may need to swap it.",
        },
        {
          icon: "fuel",
          title: "Fill up before long empty roads",
          text: "Te Anau has the last fuel before Milford Sound. Fill up in Twizel, Wānaka or Makarora too: the next fuel after Makarora is Haast, about **80 km** on.",
        },
        {
          icon: "weather",
          title: "Check the road the evening before",
          text: "The Milford Road and the Haast Pass close at short notice for snow, slips or floods. After storm damage in August 2026 the Haast road had timed convoys, so look at the road report for the day you cross.",
          link: { label: "Check the road report", href: "https://www.journeys.nzta.govt.nz/" },
          temporary: "Until the Haast road repairs end",
        },
        {
          icon: "car",
          title: "Leave a day of slack near the end",
          text: "Floods and slips close roads, so avoid a hard deadline on a crossing day.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Christchurch",
          tips: [
            {
              title: "Save Akaroa for the last stay",
              text: "A full day trip is too much on a one-night arrival stop after a long flight.",
            },
          ],
        },
        {
          place: "Lake Tekapo",
          tips: [
            {
              title: "Book stargazing for night one",
              text: "The Mount John summit tour is **239 New Zealand dollars** for an adult. Keep night two as the spare for cloud. It is not dark at **21:30** in summer, so go late.",
              link: { label: "Book on the Dark Sky Project site", href: "https://darkskyproject.co.nz/experiences/the-summit-experience/" },
            },
            {
              title: "Take no photos inside the church",
              text: "The Church of the Good Shepherd bans photos inside, and the grounds close at night.",
              link: { label: "See visiting hours", href: "https://churchofthegoodshepherd.org.nz/visit" },
            },
          ],
        },
        {
          place: "Aoraki / Mount Cook",
          tips: [
            {
              title: "Allow 3 hours for Hooker Valley",
              text: "The track is **5 km** one way, about **3 hours** return. Check the boat times for the Tasman glacier lake with the operator.",
            },
          ],
        },
        {
          place: "Wanaka",
          tips: [
            {
              title: "Start Roys Peak at first light",
              text: "It is about **16 km** return and over **1,200 m** up, a full day. Carry a head torch, spare batteries and very warm clothes if you start in the dark.",
            },
          ],
        },
        {
          place: "Queenstown",
          tips: [
            {
              title: "Leave for Milford Sound at 06:00",
              text: "The drive is about **290 km**, **4.5 hours** with no stops, and the whole day is **12 to 14 hours**. Sleeping in Te Anau halves the drive.",
            },
          ],
        },
        {
          place: "Franz Josef",
          tips: [
            {
              title: "Book the helicopter hike for morning one",
              text: "Helicopters are the only way onto the ice, and flights cancel in poor weather. The second night is your spare, so avoid the last morning.",
            },
            {
              title: "Leave Franz Josef late for the train",
              text: "Greymouth is about **2 hours 15** from Franz Josef via Hokitika. Leave about **10:30** and have lunch in Hokitika rather than waiting in Greymouth.",
            },
            {
              title: "Walk Lake Matheson at dawn or dusk",
              text: "Reflections are best on a fine, windless day at those times, not at 14:00.",
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
          title: "Pack a waterproof and a warm layer",
          text: "Mountain weather changes fast, even in January. The west coast is wet, so plan a rain day.",
        },
        {
          icon: "shield",
          title: "Go onto the glacier only with a guide",
          text: "Go by helicopter with a guide. The valley viewpoint walk is about **30 minutes** return and does not reach the ice.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "lock",
          title: "Leave nothing in the parked car",
          text: "Thieves target hire cars at tourist spots.",
        },
        {
          icon: "chat",
          title: "Download offline maps",
          text: "Phone signal is patchy on the Milford Road. Signal is available at Te Anau Downs, The Divide and Milford Sound.",
        },
      ],
    },
  ],
};
