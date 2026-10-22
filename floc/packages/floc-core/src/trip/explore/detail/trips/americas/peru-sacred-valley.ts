import { day } from "../../day";
import { at, swap } from "../../ideas";
import type { PresetDetail } from "../../preset-detail-types";

export const PERU_SACRED_VALLEY: PresetDetail = {
  stops: [
    {
      place: "Lima",
      summary: "Ceviche, the cliffs of Miraflores and a slow start.",
      days: [
        day("Land in Lima", ["14:00 Airport to Miraflores", "17:00 The cliff walk at sunset", "20:00 Pisco sour and dinner"]),
        day("Lima", ["10:00 The old centre", "13:00 Ceviche for lunch", "16:00 Barranco's bridge and murals"]),
      ],
    },
    {
      place: "Cusco",
      summary: "Two quiet days to get used to the height.",
      days: [
        day("Up to Cusco", ["08:00 Flight, 1h 20", "11:00 Coca tea and a rest", "16:00 The main square, slowly"]),
        day("Inca Cusco", ["09:00 Qorikancha", "11:00 Saqsaywaman above the town", "15:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "Sacred Valley",
      summary: "Markets, salt pans and the terraces of Moray.",
      days: [
        day("Down to the valley", ["09:00 * Pisac market", "13:00 Lunch in the valley", "16:00 Pisac ruins"], "Markets of the Sacred Valley"),
        day("Moray and the salt pans", ["09:00 The terraces of Moray", "12:00 The Maras salt pans", "16:00 Ollantaytambo's fortress"]),
      ],
    },
    {
      place: "Aguas Calientes",
      summary: "The train along the river to the foot of Machu Picchu.",
      days: [day("The train to Machu Picchu", ["12:00 Train from Ollantaytambo, 1h 45", "15:00 Arrive in Aguas Calientes", "17:00 Hot springs"])],
    },
    {
      place: "Cusco",
      summary: "Machu Picchu at opening, then back to Cusco by train.",
      days: [
        day("Machu Picchu", ["05:30 First bus up", "06:00 * Machu Picchu at opening, with a guide", "14:30 Train back to Cusco, 3h 30"], "Machu Picchu at opening"),
        day("Cusco, free", ["10:00 ~ Free day. San Pedro market, or rest.", "19:00 Dinner in San Blas"]),
      ],
    },
    {
      place: "Puno",
      summary: "Over the altiplano to the reed islands of Lake Titicaca.",
      days: [
        day("Over the altiplano", ["07:00 Bus to Puno, about 7h with stops", "15:00 Arrive by the lake", "19:00 Dinner"]),
        day("The lake", ["08:00 * Boat to the Uros reed islands", "11:00 Taquile island", "17:00 Back in Puno"], "The reed islands of Titicaca"),
        day("Home from Juliaca", ["09:00 Drive to Juliaca airport", "12:00 Flight to Lima, connect home"]),
      ],
    },
  ],
  inPlan: [
    { value: "11", label: "nights, all planned" },
    { value: "6", label: "stops" },
    { value: "2", label: "train rides" },
    { value: "3", label: "Inca sites" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Machu Picchu tickets and trains sell out. They are booked with the trip.", "Carry your passport. Machu Picchu checks it."] },
    { topic: "health", title: "Altitude", lines: ["Cusco and Puno are high. Take the first days slowly and drink water.", "Talk to a doctor if you have heart or lung trouble."] },
    { topic: "money", title: "Money", lines: ["Carry soles for markets.", "Tip guides and drivers at the end."] },
    { topic: "weather", title: "Weather", lines: ["April to October is dry. Nights in the Andes are cold."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Slow at first for the height, then steady." },
    { label: "Early starts", text: "05:30 for Machu Picchu, worth it." },
  ],
  ideas: {
    atStops: [
      at("Lima", [
        ["Barranco's murals and bars", "Relaxed", "Low"],
        ["Paraglide off the Miraflores cliffs", "Active", "Mid"],
        ["Ceviche class", "Relaxed", "Mid"],
      ]),
      at("Cusco", [
        ["San Pedro market", "Relaxed", "Low"],
        ["Rainbow Mountain for the day", "Active", "Mid"],
        ["Sacsayhuamán on foot", "Steady", "Low"],
      ]),
      at("Sacred Valley", [
        ["Moray and the Maras salt pans", "Steady", "Mid"],
        ["Pisac market and ruins", "Steady", "Low"],
      ]),
      at("Aguas Calientes", [
        ["Climb Huayna Picchu, booked ahead", "Active", "Mid"],
        ["The hot springs", "Relaxed", "Low"],
      ]),
      at("Puno", [
        ["Taquile island", "Steady", "Mid"],
        ["Sillustani tombs at sunset", "Relaxed", "Low"],
      ]),
    ],
    otherStops: [
      swap("Arequipa and the Colca canyon", 3, "Puno", "A white-stone city, then condors over one of the deepest canyons."),
      swap("Paracas", 2, "Lima", "Boats to the Ballestas islands and the Huacachina dunes."),
    ],
  },
};
