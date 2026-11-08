import type { TripKnow } from "../../know-types";

export const ZION_AND_BRYCE: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "the USA", slug: "usa" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Enter the Angels Landing lottery when it opens",
          text: "Apply from the 1st to the 20th of January (for March to May), April (June to August), July (September to November) or October (December to February). A day-before draw runs from **00:01 to 15:00** Mountain time, with results after **16:00**. It costs **$6** per application for up to 6 people, and **$3** each if chosen.",
          link: { label: "Angels Landing permits", href: "https://www.nps.gov/zion/planyourvisit/angels-landing-hiking-permits.htm" },
        },
        {
          icon: "weather",
          title: "Plan for a closed Narrows in spring",
          text: "Snowmelt closed it in 2019, 2023 and 2024, but it was open most of 2025 and 2026. September and October are the safe months.",
          link: { label: "The Narrows", href: "https://www.nps.gov/zion/planyourvisit/thenarrows.htm" },
        },
        {
          icon: "walk",
          title: "Walk the Narrows from the bottom up",
          text: "The bottom-up walk needs no permit. The top-down walk of **16 miles** does.",
        },
        {
          icon: "ticket",
          title: "Book Springdale rooms early in spring and autumn",
          text: "These seasons fill up.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get your US travel permit online",
          text: "UK passports need an ESTA (Electronic System for Travel Authorization) before you fly.",
          link: { label: "Apply for an ESTA", href: "https://esta.cbp.dhs.gov" },
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly into Las Vegas and drive to Zion",
          text: "It is **163 miles**, **2h 40 to 3h**. Leave early or late to miss delays in the Virgin River Gorge. Utah clocks are an hour ahead of Las Vegas.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Buy the non-resident annual pass",
          text: "Each park charges **$35** per car, plus **$100** per visitor aged 16 or over from outside the US. The **$250** pass drops the $100 fee, so it is cheaper at two parks.",
          link: { label: "Zion fees", href: "https://www.nps.gov/zion/planyourvisit/fees.htm" },
        },
        {
          icon: "money",
          title: "Pay by card",
          text: "Zion prefers cards, though it accepts cash. Bryce does not take cash at its fee stations.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Park in Springdale and ride the free shuttle",
          text: "Private cars cannot use Zion Canyon road while the shuttle runs. Canyon shuttles come every **5 to 10 minutes**. Be in the park before **08:00**, because lots fill early.",
        },
        {
          icon: "train",
          title: "Catch the last shuttle out of the canyon",
          text: "In 2026 it leaves at **19:15** until 24 October and **18:15** from 25 October to 28 November. Missing it can mean a walk of up to **9 miles**. The shuttle does not run from 29 November to 25 December.",
          temporary: "Until the shuttle stops for winter on 29 November",
        },
        {
          icon: "car",
          title: "Check your vehicle fits the tunnel to Bryce",
          text: "The Mount Carmel tunnel is closed to vehicles wider than **7 ft 10 in** or taller than **11 ft 4 in**. Longer than **35 ft 9 in** needs an escort. Springdale to Bryce is about **2h**.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Springdale",
          tips: [
            {
              title: "Hire Narrows gear in Springdale",
              text: "You need closed shoes, a stick and layers that are not cotton.",
            },
            {
              title: "Skip the Narrows on a bad forecast",
              text: "It closes above **150 cubic feet per second**, and for 2 hours after any flash flood warning. Rain upstream floods it too.",
            },
          ],
        },
        {
          place: "Bryce Canyon",
          tips: [
            {
              title: "Drive to Sunrise Point for sunrise",
              text: "The Bryce shuttle starts at **08:00** and runs only from 3 April to 18 October in 2026. Bring a warm layer: it is cold at sunrise even in summer.",
              link: { label: "Bryce shuttle", href: "https://www.nps.gov/brca/planyourvisit/shuttle.htm" },
            },
            {
              title: "Walk the Rim Trail",
              text: "Sunrise Point to Sunset Point is flat and paved, **0.5 mile**.",
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
          title: "Skip Angels Landing in wind, ice or rain",
          text: "The route has chains and big drops.",
        },
        {
          icon: "health",
          title: "Go slowly and drink water at Bryce",
          text: "Bryce sits high on a plateau, so expect to be short of breath.",
        },
        {
          icon: "walk",
          title: "Use traction devices in winter",
          text: "Bryce trails are icy in winter.",
        },
      ],
    },
  ],
};
