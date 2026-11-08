import type { TripKnow } from "../../know-types";

export const QUEENSTOWN_AND_WANAKA: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "New Zealand", slug: "new-zealand" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "walk",
          title: "Walk Roys Peak outside the lambing closure",
          text: "The track closes each year for lambing, from 1 October to **10 November**. December to February is the busiest time.",
          link: { label: "Check the track on the Department of Conservation site", href: "https://www.doc.govt.nz/parks-and-recreation/places-to-go/otago/places/wanaka-area/things-to-do/roys-peak-track/" },
        },
        {
          icon: "ticket",
          title: "Book the jet boat and bungy early",
          text: "Jet boat, bungy and helicopter trips sell out in summer. Book before you fly.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Apply for the travel authorisation",
          text: "A UK passport needs a New Zealand electronic travel authorisation: **17 New Zealand dollars** in the app or **23 New Zealand dollars** online.",
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
          text: "The passport must last **3 months** past the day you leave. Show a return or onward ticket and enough money at the border.",
        },
        {
          icon: "shield",
          title: "Buy insurance that covers adventure sports",
          text: "UK visitors get urgent care only, not routine care. Check that your cover includes bungy, jet boat and hiking.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Change planes on the way from the UK",
          text: "Queenstown has flights from Auckland, Christchurch and Wellington. From the UK you change at Auckland or another hub.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Pay by card, carry a little cash",
          text: "Cards work almost everywhere. Keep some cash for small cafes.",
        },
        {
          icon: "ticket",
          title: "Budget for the jet boat",
          text: "The Shotover Jet costs **199 New Zealand dollars** for an adult and lasts **25 minutes**.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire a car for the two towns",
          text: "The Crown Range road is about **68 km** and takes **1 hour 10**. The route through Cromwell is about **113 km** and **1 hour 30**, on an easier road.",
        },
        {
          icon: "car",
          title: "Drive on the left",
          text: "A UK photocard licence is valid for up to **18 months**. Winter ice can mean chains on the Crown Range.",
        },
        {
          icon: "lock",
          title: "Leave nothing in the car",
          text: "Theft from hire cars at car parks is a risk.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Queenstown",
          tips: [
            {
              title: "Hire a driver or shuttle to Gibbston",
              text: "Gibbston is about **25 km**, **25 minutes**, east of town, with about a dozen cellar doors. A shuttle runs daily and a cycle trail links the wineries.",
            },
          ],
        },
        {
          place: "Wānaka",
          tips: [
            {
              title: "Arrive early at the Roys Peak car park",
              text: "It is free and often full. The walk is about **16 km** return and over **1,200 m** up, a full day. The photo spot is about **30 minutes** below the summit.",
            },
            {
              title: "Carry a head torch for a dark start",
              text: "Carry spare batteries and very warm clothes too. Isthmus Peak is the quieter walk of similar length and difficulty.",
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
          title: "Pack a warm layer and a waterproof",
          text: "Mountain weather can change in an hour, even in summer.",
        },
      ],
    },
  ],
};
