import type { TripKnow } from "../../know-types";

export const UGANDA_AND_RWANDA: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Uganda", slug: "uganda" },
    { country: "Rwanda", slug: "rwanda" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "shield",
          title: "Read the UK warnings for Uganda first",
          text: "The UK government says terrorists are very likely to try to carry out attacks in Uganda, including in national parks and western Uganda near the Democratic Republic of the Congo border. An attack in Queen Elizabeth National Park in October 2023 killed two tourists and their driver.",
          link: { label: "UK travel advice for Uganda", href: "https://www.gov.uk/foreign-travel-advice/uganda" },
        },
        {
          icon: "health",
          title: "Check the Ebola outbreak the week you fly",
          text: "The Democratic Republic of the Congo declared an outbreak on 15 May 2026, and the World Health Organization calls it a public health emergency. Uganda's own outbreak was declared over on 27 August 2026, but screening is in place at Entebbe and Kigali airports.",
          link: { label: "UK health advice for Uganda", href: "https://www.gov.uk/foreign-travel-advice/uganda/health" },
          temporary: "Until the outbreak is declared over",
        },
        {
          icon: "shield",
          title: "Avoid Rusizi and the Lake Kivu islands",
          text: "The UK government advises against all but essential travel within **10 km** of the Congo border in Rusizi District, including the Rwandan islands in Lake Kivu and Kamembe airport. Border crossings can close at short notice.",
          link: { label: "UK travel advice for Rwanda", href: "https://www.gov.uk/foreign-travel-advice/rwanda" },
        },
        {
          icon: "ticket",
          title: "Book the gorilla permit first",
          text: "Uganda is about **US$800** (confirm with the Uganda Wildlife Authority) and Rwanda is **US$1,500**. Permits sell out months ahead. Get the cancellation terms in writing.",
        },
        {
          icon: "car",
          title: "Plan a full day for the long drives",
          text: "Murchison Falls to Kibale is **6 to 7 hours**. Roads are slow and roadworks are common: plan **60 km** an hour.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Get Uganda's online visa",
          text: "The single-entry online visa is about **US$50**. Check the official visa site for the price.",
          link: { label: "Apply for the Uganda visa", href: "https://visas.go.ug" },
        },
        {
          icon: "passport",
          title: "Skip the East Africa visa",
          text: "UK passports get a free **30 day** visa on arrival in Rwanda. The **US$100** East Africa visa only pays off if you add Kenya.",
        },
        {
          icon: "health",
          title: "Carry your yellow fever certificate",
          text: "Rwanda asks for it if you arrive from a risk country, and Uganda is one.",
        },
        {
          icon: "passport",
          title: "Check your passport has 6 months left",
          text: "Check the rules for your passport.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Withdraw cash in towns",
          text: "Cash machines have limits and cards fail outside lodges. Uganda uses shillings and dollars. Rwanda uses the Rwandan franc and mobile money.",
        },
        {
          icon: "lock",
          title: "Buy permits only from a licensed operator",
          text: "Do not pay a stranger for a spare permit or wire money to a person.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Hire one driver-guide for the whole route",
          text: "Do not drive outside main towns after dark. Skip boda-bodas (motorbike taxis).",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Murchison Falls",
          tips: [
            {
              title: "Walk the falls top on another day",
              text: "The boat to the foot of the falls takes several hours. Walk to the top the next morning on the way out.",
            },
          ],
        },
        {
          place: "Queen Elizabeth",
          tips: [
            {
              title: "Sleep at Ishasha on the road to Bwindi",
              text: "The Ishasha sector is a long drive from Mweya. Tree-climbing lions are not guaranteed.",
            },
          ],
        },
        {
          place: "Bwindi",
          tips: [
            {
              title: "Hire a porter for the trek",
              text: "Tracking can take **2 to 8 hours** on steep, slippery ground. A briefing comes first, around **08:00** to **09:00**. Wear boots and gloves.",
            },
            {
              title: "Do not track gorillas with a cold",
              text: "Rangers turn you back. Stay several metres away and do not eat near them.",
            },
          ],
        },
        {
          place: "Lake Bunyonyi",
          tips: [
            {
              title: "Ask your lodge before you swim",
              text: "The risk of bilharzia (a parasite in fresh water) varies by shore.",
            },
          ],
        },
        {
          place: "Kigali",
          tips: [
            {
              title: "Plan around Umuganda on the last Saturday",
              text: "Umuganda is held about **08:00 to 11:00**. Most shops shut and cars are restricted.",
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
          title: "Take malaria tablets for low-lying parks",
          text: "Bwindi and Kigali sit at altitude, with a lower risk. Ask a travel clinic.",
        },
        {
          icon: "chat",
          title: "Tell your lodge your plan",
          text: "Coverage is weak in Bwindi.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "customs",
          title: "Leave plastic bags at home",
          text: "They are banned in Rwanda.",
        },
        {
          icon: "customs",
          title: "Avoid public affection",
          text: "Same-sex acts are illegal in Uganda, with severe penalties.",
        },
        {
          icon: "customs",
          title: "Do not photograph military sites",
          text: "Keep your camera away from them.",
        },
      ],
    },
  ],
};
