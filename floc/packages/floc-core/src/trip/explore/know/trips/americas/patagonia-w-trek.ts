import type { TripKnow } from "../../know-types";

export const PATAGONIA_W_TREK: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "Argentina", slug: "argentina" },
    { country: "Chile", slug: "chile" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Book the refuges and the boat first",
          text: "Refuge beds sell out as soon as they are released. The Pehoé lake catamaran sells tickets online, so buy early for December to February.",
        },
        {
          icon: "ticket",
          title: "Buy the Torres del Paine pass online",
          text: "Since 1 May 2026 there are no sales at the gate. Chile sets a price for one day or for two days or more, valid for up to **10 days**. Check the amount on the official site.",
          link: { label: "Buy the park pass", href: "https://pasesparques.cl" },
        },
        {
          icon: "weather",
          title: "Check each refuge's open dates",
          text: "December to February is busiest. The lake catamaran runs about October to April.",
        },
        {
          icon: "walk",
          title: "Add a night before the French valley",
          text: "After a night at Grey you walk back to Paine Grande (**3.5 to 4h**), then to Italiano (**2.5h**) and Cuernos (**2 to 2.5h**). That is **8 to 9 hours** of walking before the side trip.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Keep your Chile tourist card",
          text: "UK passports need no visa for Argentina or Chile: up to **90 days** in each. Chile gives a paper card. Keep it until you leave.",
        },
        {
          icon: "customs",
          title: "Fill in the Chile agriculture declaration",
          text: "Do it online or on paper at the border. Fresh fruit, dairy and meat are banned.",
          link: { label: "Chile entry declaration", href: "https://ingresoachile.cl" },
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "plane",
          title: "Fly into El Calafate, out of Punta Arenas",
          text: "Most flights go through Buenos Aires, then Santiago on the way home. An open-jaw ticket saves two days.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "ticket",
          title: "Budget for Los Glaciares",
          text: "The park fee is **50,000 Argentine pesos** a day from 1 June 2026, or **100,000** for a 3-day pass. The Perito Moreno boat price does not cover it.",
          link: { label: "Argentina park fees", href: "https://www.argentina.gob.ar/parquesnacionales/tarifas" },
        },
        {
          icon: "money",
          title: "Carry cash for refuge bars",
          text: "Cards work in towns.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Change in El Calafate for Puerto Natales",
          text: "There is no through bus from El Chaltén. Take a bus to El Calafate (about **3h**), then one to Natales (about **6h** with the border). The total is **8 to 9 hours**.",
        },
        {
          icon: "ticket",
          title: "Book both buses, with a buffer",
          text: "Timetables come out only a few months ahead. The border crossing is at Cancha Carrera and Cerro Castillo.",
        },
        {
          icon: "car",
          title: "Check the bus back out of the park",
          text: "Buses from Laguna Amarga to Natales run a few times a day. Confirm the times with the bus firm before you book dinner in town.",
        },
        {
          icon: "car",
          title: "Catch the first bus to Punta Arenas",
          text: "It leaves at about **06:45 to 07:00** and takes about **3h 15**. Allow for the airport transfer before an early flight.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "El Calafate",
          tips: [
            {
              title: "Allow for weather on the glacier boat",
              text: "The Perito Moreno boat depends on the weather. The glacier is in Los Glaciares, so the park fee applies.",
            },
          ],
        },
        {
          place: "El Chaltén",
          tips: [
            {
              title: "Start Laguna de los Tres at 07:00",
              text: "The day is **07:00 out, 18:00 back** in long summer daylight. Fitz Roy is often in cloud, so keep Laguna Torre as a swap.",
            },
            {
              title: "Pay the park fee online here",
              text: "The Chaltén fee is online or by scannable code only. Cash is not accepted.",
            },
          ],
        },
        {
          place: "Puerto Natales",
          tips: [
            {
              title: "Keep a spare day for wind",
              text: "Wind can close days in the park. A spare day here saves the walk.",
            },
          ],
        },
        {
          place: "Refugios on the W",
          tips: [
            {
              title: "Take the catamaran from Pudeto",
              text: "Times are set by the operator and change, so book ahead. The walk to Grey is about **11 km**, **3.5 to 4h**, so a late boat means a late arrival.",
            },
            {
              title: "Stay at Grey to book ice hikes",
              text: "The ice hike and kayak are sold only to guests who stay at Refugio Grey or the Grey campsite.",
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
          title: "Pack layers and a shell",
          text: "You can get wind, sun and rain in one hour.",
        },
        {
          icon: "lock",
          title: "Save your park pass offline",
          text: "Signal in the park is poor.",
        },
      ],
    },
  ],
};
