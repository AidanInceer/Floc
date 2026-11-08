import type { TripKnow } from "../../know-types";

export const ADELAIDE_AND_KANGAROO_ISLAND: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Australia", slug: "australia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "shield",
          title: "Watch Seal Bay sea lions from the boardwalk",
          text: "Beach access has been paused since late July 2026 because of bird flu. You can watch from the boardwalk. Buy tickets at the visitor centre; booking is not needed.",
          link: { label: "Check Seal Bay on the South Australia parks site", href: "https://www.parks.sa.gov.au/experiences/seal-bay/plan-your-visit/bird-flu-update" },
          temporary: "Until the beach pause is lifted",
        },
        {
          icon: "boat",
          title: "Book the ferry and your car early",
          text: "Ferry car spaces and hire cars sell out in summer. Book weeks ahead.",
        },
        {
          icon: "car",
          title: "Plan Barossa as a full day",
          text: "With 2 nights in Adelaide, the Barossa day and the drive to Cape Jervis are tight. Arrive on night one, go to the Barossa on day two, and sail early on day three.",
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
          title: "Buy insurance with medical evacuation",
          text: "The UK agreement covers urgent hospital care, not ambulances or medical evacuation.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "boat",
          title: "Allow about 2 hours to reach the ferry",
          text: "Cape Jervis is **88 km** from Adelaide, about **1 hour 30** by road. Check in **30 minutes** before sailing. The crossing is about **45 minutes**. Coaches run from Adelaide.",
        },
        {
          icon: "boat",
          title: "Check the ferry timetable",
          text: "The ferry company is changing ships, so times and loading may change.",
          link: { label: "Check the ferry timetable on the ferry company site", href: "https://www.sealink.com.au/kangaroo-island/visitor-information/getting-to-kangaroo-island/" },
          temporary: "Until the new ships are in service",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "ticket",
          title: "Pay the Flinders Chase entry fee",
          text: "Expect an adult fee of **A$13** to **A$22.40**, and ask the visitor centre for the exact fee. The Kangaroo Island tour pass is **A$58.50** for an adult for 12 months and includes Seal Bay.",
          link: { label: "See Flinders Chase fees", href: "https://www.parks.sa.gov.au/parks/flinders-chase-national-park" },
        },
        {
          icon: "money",
          title: "Pay by card, but expect few shops",
          text: "Cards work on most of the island. Shops and fuel stops are few.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Take your car or hire on the island",
          text: "The island is about **145 km** long, east to west. You can hire at Kingscote or Penneshaw.",
        },
        {
          icon: "fuel",
          title: "Fill the tank before you go west",
          text: "Distances are longer than they look.",
        },
        {
          icon: "car",
          title: "Drive on the left, never at night",
          text: "Wildlife is on the roads. Hire insurance often excludes unsealed roads, and many side roads are unsealed.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Adelaide",
          tips: [
            {
              title: "Eat at the Central Market in the day",
              text: "It is a daytime market, open Tuesday to Saturday and closed Sunday and Monday. Only Friday evening works for dinner, when it is open until **21:00**.",
              link: { label: "See Adelaide Central Market", href: "https://adelaidecentralmarket.com.au/" },
            },
            {
              title: "Use a driver or tour for the Barossa",
              text: "Cellar doors and driving do not mix.",
            },
          ],
        },
        {
          place: "Kangaroo Island",
          tips: [
            {
              title: "Check alerts before Remarkable Rocks",
              text: "Strong wind can close Remarkable Rocks and Admirals Arch. Flinders Chase closes on days of catastrophic fire danger.",
            },
            {
              title: "Stay overnight rather than take a day coach",
              text: "An island day coach from Adelaide spends the day on the road.",
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
          title: "Watch the fire risk from November to February",
          text: "Install the South Australia fire alert app. Fire ban from 1 December 2026 to 24 March 2027 for wood fires.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Download offline maps before you cross",
          text: "Signal can be weak on the island.",
        },
      ],
    },
  ],
};
