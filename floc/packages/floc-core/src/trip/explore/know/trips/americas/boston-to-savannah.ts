import type { TripKnow } from "../../know-types";

export const BOSTON_TO_SAVANNAH: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "the USA", slug: "usa" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "car",
          title: "Break the drive with a night in Asheville",
          text: "Shenandoah to Charleston is about **505 to 555 miles**, **8h 40 to 10h** before stops. Shenandoah to Asheville is about **5h 45**, then Asheville to Charleston about **4h 30**.",
        },
        {
          icon: "car",
          title: "Price two one-way car hires",
          text: "Take car one from Boston to New York and car two from Washington to Savannah. One-way fees are high, so check them before you book.",
        },
        {
          icon: "weather",
          title: "Go in May, September or October",
          text: "Charleston and Savannah are hot and humid in June. Hurricane season runs to 30 November, so pick flexible fares for September and October.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get your US travel permit online",
          text: "UK passports need an ESTA (Electronic System for Travel Authorization). The fee is about **$40**. Use the official site, because other sites charge more.",
          link: { label: "Apply for an ESTA", href: "https://esta.cbp.dhs.gov" },
        },
        {
          icon: "passport",
          title: "Apply for a visa if you visited Cuba",
          text: "You usually cannot get an ESTA (Electronic System for Travel Authorization) if you have been in Cuba since **12 January 2021**. Apply for a visa instead.",
        },
        {
          icon: "passport",
          title: "Expect a phone check at the border",
          text: "Officers can ask to see your phone and social media. Refusing can mean you are refused entry. Lock your phone and back it up before you fly.",
        },
        {
          icon: "passport",
          title: "Sign the Ebola form before boarding",
          text: "From **3 November 2026** a signed declaration is needed. Ask your airline how to get it.",
          temporary: "Until the Ebola screening ends",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly into Boston and home from Savannah",
          text: "Savannah has no direct UK flight, so home needs a connection. Price an open-jaw ticket against a return.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Tip in restaurants",
          text: "Tip **18 to 20 percent**. Menu prices leave out tax, which is added at the till. Cards work everywhere; carry a little cash for tips.",
        },
        {
          icon: "ticket",
          title: "Pay for Shenandoah by card",
          text: "Entrance stations take cards only. The pass is **$30** per vehicle for **7 days** and covers Skyline Drive.",
          link: { label: "Shenandoah fees", href: "https://www.nps.gov/shen/planyourvisit/fees.htm" },
        },
        {
          icon: "car",
          title: "Budget for city parking",
          text: "Parking in the big cities can cost more than the car. Drop the hire car and use trains.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Take the train between New York and Washington",
          text: "Do not use a car in New York, Philadelphia or Washington. Times vary by train, so check the timetable.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Cape Cod",
          tips: [
            {
              title: "Start early for Provincetown",
              text: "It is a long out-and-back drive. A whale-watching boat takes part of the day.",
            },
          ],
        },
        {
          place: "Newport",
          tips: [
            {
              title: "Reach The Breakers by 16:00",
              text: "The house opens at **09:00** and last entry is **16:00**. Most other mansions close for the winter.",
            },
          ],
        },
        {
          place: "New York",
          tips: [
            {
              title: "Drop the car in the city by 14:00",
              text: "Hand it back in the city, not at the airport.",
            },
            {
              title: "Eat in the West Village or Brooklyn",
              text: "Skip the restaurants round Times Square.",
            },
          ],
        },
        {
          place: "Philadelphia",
          tips: [
            {
              title: "Book a timed ticket for Independence Hall",
              text: "Needed from March to December. Entry is free, with a **$1** booking fee per ticket on recreation.gov.",
              link: { label: "Independence Hall tickets", href: "https://www.nps.gov/inde/planyourvisit/fees.htm" },
            },
          ],
        },
        {
          place: "Washington",
          tips: [
            {
              title: "Book the free Air and Space pass first",
              text: "A timed pass is needed for everyone. The museum opens **10:00 to 17:30** and part of the east end is closed for renovation.",
              link: { label: "Air and Space visit page", href: "https://airandspace.si.edu/visit/museum-dc" },
            },
          ],
        },
        {
          place: "Shenandoah",
          tips: [
            {
              title: "Drive Skyline Drive at 08:00",
              text: "You beat the queue at the entrance stations.",
            },
            {
              title: "Book your Old Rag ticket, allow a day",
              text: "A day-use ticket on recreation.gov is needed from **1 March to 30 November**, on top of the park fee. The hike is a full-day scramble.",
            },
          ],
        },
        {
          place: "Charleston",
          tips: [
            {
              title: "Book the Fort Sumter boat ahead",
              text: "The boat is the only way in. It leaves from Liberty Square or Patriots Point, and passes do not cover it. Times can change, so check on the day.",
              link: { label: "Fort Sumter visit page", href: "https://www.nps.gov/fosu/planyourvisit/index.htm" },
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
          title: "Check your legs for ticks after hikes",
          text: "Ticks live on the Shenandoah trails in the warm months.",
        },
      ],
    },
  ],
};
