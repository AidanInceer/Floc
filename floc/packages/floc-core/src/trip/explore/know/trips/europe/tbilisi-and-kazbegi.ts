import type { TripKnow } from "../../know-types";

export const TBILISI_AND_KAZBEGI: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Georgia", slug: "georgia" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "weather",
          title: "Go between May and October",
          text: "September and October have the clearest skies.",
        },
        {
          icon: "pin",
          title: "Book guesthouses early for July and August",
          text: "Kazbegi is busy then.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Buy travel insurance for your whole stay",
          text: "Health and accident cover of at least **30,000 lari** has been required since 1 January 2026. Carry proof, and check the policy covers hiking.",
          link: { label: "UK entry rules for Georgia", href: "https://www.gov.uk/foreign-travel-advice/georgia/entry-requirements" },
        },
        {
          icon: "passport",
          title: "Skip the visa for up to a year",
          text: "UK passports need no visa. You can stay up to **1 year**.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "train",
          title: "Take the airport bus into town",
          text: "The airport is about **17 km** out. Bus 337 (formerly 37) costs **1 lari** and takes **45 to 75 min**. A Bolt taxi costs **25 to 35 lari**.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Pay in lari, whatever the price shows",
          text: "Some prices are quoted in dollars. Cards work in hotels and larger restaurants.",
        },
        {
          icon: "money",
          title: "Carry cash in the mountains",
          text: "Use cash machines at big banks in town. Exchange at the airport is about 5 to 8% worse than in the city.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Allow 2h 30 to 3h 30 to Kazbegi",
          text: "The drive is about **157 km**. A minibus from Didube costs about **15 lari**; a private car starts at about **595 lari**.",
        },
        {
          icon: "car",
          title: "Use the Bolt app in Tbilisi",
          text: "A ride across town costs **4 to 8 lari**. Do not flag street taxis. The metro and bus cost **1 lari** with a Metrocard.",
        },
        {
          icon: "weather",
          title: "Check the Military Road from November to April",
          text: "The Gudauri to Kobi section can shut in heavy snow or avalanche risk from November to April. Traffic there was suspended on 13 January 2026.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Tbilisi",
          tips: [
            {
              title: "Try the sulphur baths in Abanotubani",
              text: "A public hall is about **3 to 5 lari** and a private cabin about **30 to 150 lari**.",
            },
            {
              title: "Join a supra",
              text: "A supra is a feast. A toastmaster, called the tamada, leads the toasts.",
            },
          ],
        },
        {
          place: "Kazbegi",
          tips: [
            {
              title: "Walk up to Gergeti Trinity church",
              text: "The walk takes **1.5 to 2h**. A shared jeep costs about **30 to 50 lari** return. The church is at **2,170 m**, so walk slowly. Cloud can hide Kazbek.",
            },
            {
              title: "Pack warm clothes",
              text: "Stepantsminda is **10 to 15°C** cooler than Tbilisi.",
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
          title: "Avoid protests on Rustaveli Avenue",
          text: "Daily protests have run since late 2024 and can escalate without warning, especially on Saturday evenings. Joining one can mean extra questions on exit or refused re-entry.",
          link: { label: "UK safety advice for Georgia", href: "https://www.gov.uk/foreign-travel-advice/georgia/safety-and-security" },
        },
        {
          icon: "lock",
          title: "Watch your pockets and your drink",
          text: "Pickpockets work in crowds.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Dress modestly in churches",
          text: "Women cover their heads at Gergeti.",
        },
      ],
    },
  ],
};
