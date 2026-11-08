import type { TripKnow } from "../../know-types";

export const CAPE_TO_VICTORIA_FALLS: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "South Africa", slug: "south-africa" },
    { country: "Namibia", slug: "namibia" },
    { country: "Botswana", slug: "botswana" },
    { country: "Zimbabwe", slug: "zimbabwe" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "plane",
          title: "Add a night in Windhoek before the delta",
          text: "There is no flight from Etosha to the delta. Drive to Windhoek, then fly to Maun (a morning flight on Monday, Wednesday, Friday and Sunday in 2026), then take a light aircraft to camp. A drive of about **5h** cannot connect the same day.",
        },
        {
          icon: "plane",
          title: "Allow a day from the delta to Chobe",
          text: "It is a camp flight to Maun, then a scheduled flight to Kasane, about **4** a week. Fix the dates before you book the camps.",
        },
        {
          icon: "ticket",
          title: "Book Sossusvlei, Etosha and delta camps months ahead",
          text: "They sell out.",
        },
        {
          icon: "weather",
          title: "Go between May and October",
          text: "It is dry and best for game. The delta flood peaks June to August, the falls are heaviest April to June and thin by October. Desert mornings are cold.",
        },
        {
          icon: "drop",
          title: "Treat Devil's Pool as a long shot",
          text: "It is on the Zambian side and open about mid-August to December. Only September and October overlap this trip. Entering Zambia needs the joint Univisa at **US$50**.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get visas for Namibia and Zimbabwe",
          text: "UK passports need a Namibia visa (**N$1,600**, Namibian dollars) and a Zimbabwe visa. The Univisa (**US$50**, **30 days**) can be bought at Kazungula. South Africa and Botswana allow **90 days** without a visa.",
        },
        {
          icon: "passport",
          title: "Check your passport pages",
          text: "Namibia, Botswana and Zimbabwe want **6 months** left and **3** blank pages. South Africa wants **30 days** after you leave and **2** blank pages.",
        },
        {
          icon: "customs",
          title: "File the South African online declaration",
          text: "Since 1 July 2026 you must file it online before you enter or leave South Africa. Missing it alone does not block you, but file first.",
        },
        {
          icon: "passport",
          title: "Carry an unabridged birth certificate for children",
          text: "Check the rules for your passport.",
        },
        {
          icon: "health",
          title: "See a travel clinic about malaria months",
          text: "Etosha is high from December to April. Northern Botswana is high from October to May. Sossusvlei and Swakopmund are very low.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Use rand in Namibia",
          text: "Namibian dollars are tied to the South African rand.",
        },
        {
          icon: "money",
          title: "Take small clean US dollar notes for Zimbabwe",
          text: "Cash dollars are scarce, cards may fail, change is hard and torn notes are refused.",
        },
        {
          icon: "ticket",
          title: "Pay Cape Point and Boulders fees by card",
          text: "From 1 November 2026, **R592** and **R282** (South African rand) per foreign adult. The gates take cards only.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Keep gravel speeds low and stop before dark",
          text: "Namibia has three long drives of **4h 30 to 5h**. Keep under **80 km** an hour on gravel, and never drive after dark: animals and livestock are on the road.",
        },
        {
          icon: "plane",
          title: "Pack a soft bag for the light aircraft",
          text: "About **20 kg**. Confirm with the operator.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Cape Town",
          tips: [
            {
              title: "Put the cable car on the clearest day",
              text: "An adult return is **R475** (South African rand) online and **R530** at the desk, valid **7 days**. It shuts often in wind.",
              link: { label: "Table Mountain cable car prices", href: "https://www.tablemountain.net/plan-your-visit/ticket-prices/" },
            },
            {
              title: "Drive Chapman's Peak first, Boulders last",
              text: "Chapman's Peak closes in strong wind and for repairs: check the road the night before. Boulders is busiest mid-day.",
            },
          ],
        },
        {
          place: "Windhoek",
          tips: [
            {
              title: "Do not hail street taxis",
              text: "Tourists are mugged in Windhoek, even by day. Carry photo identity for police checks.",
            },
          ],
        },
        {
          place: "Sossusvlei",
          tips: [
            {
              title: "Ask your camp for the month's gate time",
              text: "The Sesriem gate opens at sunrise. If you sleep outside the park you cannot reach the dune before sunrise. Be off the dunes by about **10:00** in warm months.",
            },
          ],
        },
        {
          place: "Swakopmund",
          tips: [
            {
              title: "Book Sandwich Harbour through an operator",
              text: "It needs a permit, which the operator holds. Tours follow the tide, so the start time can move.",
            },
          ],
        },
        {
          place: "Etosha",
          tips: [
            {
              title: "Reach camp before sunset",
              text: "Gates open at sunrise and you must be in camp or out of the park by sunset. Times change weekly. Plan the **5h** drive to arrive before dusk.",
            },
          ],
        },
        {
          place: "Chobe",
          tips: [
            {
              title: "Lock the door and use the safe",
              text: "River-front lodges have had room break-ins.",
            },
          ],
        },
        {
          place: "Victoria Falls",
          tips: [
            {
              title: "Allow time at the Kazungula border",
              text: "It is about **1h 30** from Kasane. The crossing takes **20 to 60 min**.",
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
          title: "Carry plenty of water and cover up",
          text: "The hot, dry climate in Namibia can cause dehydration and skin problems.",
        },
        {
          icon: "health",
          title: "Keep away from Cape fur seals",
          text: "Rabies is in seals in South Africa and Namibia. If bitten, get medical help at once.",
        },
        {
          icon: "walk",
          title: "Hike Table Mountain in a group",
          text: "The UK government advises a group of **4 or more**. Finish before dark.",
        },
      ],
    },
  ],
};
