import type { TripKnow } from "../../know-types";

export const HOBART_AND_FREYCINET: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Australia", slug: "australia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Fit a Saturday into your Hobart days",
          text: "Salamanca Market runs on Saturdays only, **08:30 to 15:00**. Mona is open Thursday to Monday, **10:00 to 17:00**, so Friday and Saturday or Saturday and Sunday fits both.",
          link: { label: "Check Mona opening days", href: "https://mona.net.au/visit" },
        },
        {
          icon: "ticket",
          title: "Book Mona and your Freycinet room",
          text: "Mona entry slots are timed and limited. Rooms near Freycinet fill early for December and January.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Apply for the free eVisitor before you fly",
          text: "A UK passport can use the free eVisitor, or the electronic travel authorisation app, which may add a service fee. Check the fee before you pay.",
        },
        {
          icon: "shield",
          title: "Buy travel insurance",
          text: "The UK agreement covers urgent hospital care, not ambulances or medical evacuation. Insure for local treatment and evacuation.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Expect a change in Melbourne or Sydney",
          text: "Flights to Hobart usually connect there. Pick up a hire car at the airport.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Budget for Mona",
          text: "Entry for visitors from outside Tasmania is **A$45** for an adult, with a **A$3.50** online fee. Prices may be higher now, so check the total when you book.",
        },
        {
          icon: "ticket",
          title: "Buy the Tasmanian parks pass online",
          text: "Freycinet needs one: **A$49.15** a day per vehicle for up to 8 people, or **A$24.55** a person on foot or by bus. An annual pass is **A$104.75**.",
          link: { label: "Buy a pass from Parks Tasmania", href: "https://passes.parks.tas.gov.au" },
        },
        {
          icon: "money",
          title: "Carry some cash for market stalls",
          text: "Cards work in most places.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Drive on the left, in daylight",
          text: "Hobart to Coles Bay is about **2 hours 30**. Parks Tasmania asks drivers to avoid reserves at night because wildlife is on the roads.",
        },
        {
          icon: "car",
          title: "Check your hire cover for unsealed roads",
          text: "Hire insurance often excludes them.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Hobart",
          tips: [
            {
              title: "Take the Mona ferry from Brooke Street Pier",
              text: "The crossing is about **30 minutes**. A new timetable starts on 3 December 2026, so check the first and last sailings.",
            },
            {
              title: "Check the road before Mount Wellington",
              text: "The summit road closes in snow and ice.",
            },
          ],
        },
        {
          place: "Coles Bay",
          tips: [
            {
              title: "Treat the Wineglass lookout as a steep walk",
              text: "It is **2.6 km** return, **1 to 1.5 hours**, grade 3 with steep sections. The beach walk past the lookout is about **3 hours** return.",
              link: { label: "See the Freycinet walks", href: "https://parks.tas.gov.au/explore-our-parks/freycinet-national-park" },
            },
            {
              title: "Check oyster farm hours first",
              text: "Hours change by season, so call before you go.",
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
          title: "Cover up against strong sun",
          text: "The sun is strong in Australia. Wear a hat and sunscreen.",
        },
        {
          icon: "walk",
          title: "Wear sturdy shoes on the granite",
          text: "The rock is slippery in rain and loose underfoot. Carry water and tell someone your plans on longer walks.",
        },
        {
          icon: "weather",
          title: "Check the campfire ban",
          text: "A campfire ban on reserved land started on 26 October 2026. Check each campground.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Download offline maps",
          text: "Signal can be weak outside the towns.",
        },
      ],
    },
  ],
};
