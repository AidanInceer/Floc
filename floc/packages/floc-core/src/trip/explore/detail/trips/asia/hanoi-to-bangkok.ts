import { day } from "../../day";
import { at, swap } from "../../ideas";
import type { PresetDetail } from "../../preset-detail-types";

export const HANOI_TO_BANGKOK: PresetDetail = {
  stops: [
    {
      place: "Hanoi",
      summary: "The old quarter on foot, and a day among the limestone of Halong Bay.",
      days: [
        day("Land in the old quarter", ["14:00 Noi Bai to the hotel by Hoan Kiem lake", "17:00 Walk the 36 streets", "19:00 Street food tour, plastic stools and bun cha"]),
        day("A day on Halong Bay", ["07:30 Road to Halong, about 2h 30", "11:00 * Boat out among the karsts", "14:00 Kayak into a lagoon", "21:30 The night train south from Hanoi"], "A day on Halong Bay"),
      ],
    },
    {
      place: "Hue",
      summary: "The citadel and the royal tombs on the Perfume river.",
      days: [
        day("Off the night train", ["09:00 * Arrive in Hue, breakfast and a nap", "14:00 The imperial citadel", "18:30 Royal-style dinner"], "The night train to Hue"),
        day("Tombs by boat", ["08:30 Dragon boat up the Perfume river", "10:00 Thien Mu pagoda", "13:00 Tomb of Tu Duc", "16:00 Tomb of Khai Dinh"]),
      ],
    },
    {
      place: "Hoi An",
      summary: "Over the Hai Van pass to the lantern town, with a free day for tailors and the beach.",
      days: [
        day("The Hai Van pass", ["09:00 Drive the Hai Van pass", "12:30 Lunch at Lang Co bay", "17:00 Old town as the lanterns come on"]),
        day("Cooking and cycling", ["08:00 Market walk with a cook", "11:00 Cooking class on the river", "16:00 Cycle out to the rice fields"]),
        day("Hoi An, free", ["10:00 ~ Free day. Tailors, An Bang beach, or nothing.", "19:00 Lanterns on the river"]),
      ],
    },
    {
      place: "Ho Chi Minh City",
      summary: "Saigon's noise, the war museum and the Cu Chi tunnels.",
      days: [
        day("Fly south", ["10:00 Flight from Da Nang, 1h 25", "15:00 Notre-Dame cathedral and the post office", "19:00 Rooftop drinks, then pho"]),
        day("Cu Chi and the museum", ["08:00 The Cu Chi tunnels", "14:00 War remnants museum", "18:30 Ben Thanh night market"]),
      ],
    },
    {
      place: "Phnom Penh",
      summary: "Over the border to the riverfront, the palace and the hard history of Tuol Sleng.",
      days: [
        day("Into Cambodia", ["08:00 Bus to Phnom Penh, about 6h", "16:00 Riverfront walk", "19:00 Khmer dinner"]),
        day("The palace and the past", ["08:30 The royal palace and silver pagoda", "11:00 Tuol Sleng museum", "14:30 The killing fields at Choeung Ek", "19:00 Quiet dinner together"]),
      ],
    },
    {
      place: "Siem Reap",
      summary: "Three days of temples, Angkor Wat at sunrise, and a floating village.",
      days: [
        day("North to Siem Reap", ["08:00 Bus to Siem Reap, about 6h", "17:00 Pub Street and the night market"]),
        day("Angkor Wat at sunrise", ["04:45 Tuk-tuk to Angkor Wat", "05:45 * Sunrise over the towers", "09:00 Angkor Thom and the faces of the Bayon", "13:00 Ta Prohm and its trees"], "Angkor Wat at sunrise"),
        day("The lake and the circus", ["09:00 Floating village on Tonle Sap", "14:00 ~ Free afternoon.", "19:00 Phare, the Cambodian circus"]),
      ],
    },
    {
      place: "Bangkok",
      summary: "The temples, the river and Chinatown's street food to end.",
      days: [
        day("Fly to Bangkok", ["11:00 Flight from Siem Reap, 1h 10", "15:00 Wat Pho and the reclining Buddha", "19:00 Chinatown, Yaowarat road"]),
        day("Palace and river", ["08:30 The Grand Palace", "12:00 Longtail through the canals", "18:00 Rooftop for the last sunset"]),
        day("Home from Bangkok", ["10:00 Train to Suvarnabhumi", "13:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "16", label: "nights, all planned" },
    { value: "3", label: "countries" },
    { value: "7", label: "stops" },
    { value: "2", label: "flights" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Vietnam and Cambodia both need a visa for most passports. Apply online before you go.", "Bring a spare passport photo for the Cambodian border."] },
    { topic: "money", title: "Money", lines: ["Cambodia runs on US dollars as much as riel. Carry small notes.", "Vietnamese dong for markets and street food."] },
    { topic: "customs", title: "Temples", lines: ["Cover shoulders and knees at the temples and the palaces.", "Tuol Sleng and the killing fields ask for quiet."] },
    { topic: "health", title: "Health", lines: ["Talk to a travel clinic about vaccines well before you go.", "Drink bottled water. Use repellent at dusk."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "On the move. Seven stops, two long bus days." },
    { label: "Early starts", text: "One 04:45 start for Angkor Wat, worth it." },
  ],
  ideas: {
    atStops: [
      at("Hanoi", [
        ["Street food walk in the Old Quarter", "Relaxed", "Low"],
        ["Water puppet show", "Relaxed", "Low"],
        ["Temple of Literature", "Relaxed", "Low"],
      ]),
      at("Hue", [
        ["Cycle out to the royal tombs", "Active", "Low"],
        ["Dragon boat on the Perfume river", "Relaxed", "Low"],
      ]),
      at("Hoi An", [
        ["Have clothes made by a tailor", "Relaxed", "Mid"],
        ["Cycle to An Bang beach", "Steady", "Free"],
        ["Basket boat in the coconut palms", "Relaxed", "Low"],
      ]),
      at("Ho Chi Minh City", [
        ["Cu Chi tunnels", "Steady", "Mid"],
        ["Mekong delta for the day", "Relaxed", "Mid"],
      ]),
      at("Phnom Penh", [
        ["Royal Palace", "Relaxed", "Low"],
        ["Sunset boat on the Mekong", "Relaxed", "Low"],
      ]),
      at("Siem Reap", [
        ["Cycle the temples beyond Angkor Wat", "Active", "Low"],
        ["Phare circus", "Relaxed", "Mid"],
        ["Floating village on Tonlé Sap", "Relaxed", "Mid"],
      ]),
      at("Bangkok", [
        ["Chao Phraya by express boat", "Relaxed", "Low"],
        ["Chatuchak weekend market", "Relaxed", "Low"],
        ["Thai massage at Wat Pho", "Relaxed", "Low"],
      ]),
    ],
    otherStops: [
      swap("Ha Long Bay", 2, "Hue", "A night on a junk among the limestone islands."),
      swap("Kampot", 2, "Phnom Penh", "Pepper farms, the river and Bokor mountain."),
    ],
  },
};
