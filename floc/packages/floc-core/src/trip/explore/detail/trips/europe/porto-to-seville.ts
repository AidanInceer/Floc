import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const PORTO_TO_SEVILLE: PresetDetail = {
  stops: [
    {
      place: "Porto",
      summary: "The Ribeira, the port lodges and a day up the Douro.",
      days: [
        day("Land in Porto", ["13:00 Metro from the airport", "16:00 Walk down to the Ribeira", "19:00 Port tasting across the river in Gaia"]),
        day("The Douro valley", ["09:00 Drive up the valley", "12:00 Lunch at a quinta among the vines", "15:00 Boat on the river", "19:30 Back in Porto"], "Port lodges and the Douro"),
      ],
    },
    {
      place: "Lisbon",
      summary: "Trams, tiles, custard tarts and the palaces of Sintra.",
      days: [
        day("Train to Lisbon", ["10:00 Alfa Pendular, about 3h", "15:00 Tram 28 through the Alfama", "20:00 Fado in a small bar"]),
        day("Belém", ["09:30 Jerónimos monastery", "11:30 Custard tarts at the source", "15:00 ~ Free afternoon.", "19:00 Sunset at a miradouro"]),
        day("Sintra", ["09:00 Train to Sintra", "10:00 Pena palace", "13:00 Quinta da Regaleira", "17:00 Cabo da Roca"], "Sintra's palaces"),
      ],
    },
    {
      place: "Évora",
      summary: "A night inside the walls of a Roman town.",
      days: [day("Into the Alentejo", ["10:00 Pick up the car, drive to Évora", "13:00 The Roman temple and the bone chapel", "19:30 Alentejo dinner"])],
    },
    {
      place: "Lagos",
      summary: "Three days of cliffs, coves and grottoes.",
      days: [
        day("South to the sea", ["10:00 Drive to Lagos, about 3h", "15:00 Ponta da Piedade cliff walk", "19:00 Fish dinner on the harbour"]),
        day("The grottoes", ["10:00 Kayak to the grottoes", "13:00 Lunch at Praia do Camilo", "16:00 ~ Free afternoon on the beach."]),
        day("The seven hanging valleys", ["09:00 Drive to Benagil", "10:00 Walk the seven hanging valleys", "17:00 Sunset at Sagres"]),
      ],
    },
    {
      place: "Seville",
      summary: "Over the border to the Alcázar, the cathedral and Triana.",
      days: [
        day("Into Spain", ["10:00 Drive to Seville, about 3h 30", "15:00 Drop the car", "18:00 Plaza de España", "21:00 Flamenco"]),
        day("Alcázar and Triana", ["09:30 The Alcázar", "12:30 The cathedral and the Giralda", "20:00 A tapas crawl in Triana"], "A tapas crawl in Triana"),
        day("Seville, free", ["10:00 ~ Nothing planned.", "19:00 Las Setas at sunset"]),
        day("Home from Seville", ["09:00 Taxi to the airport", "11:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "12", label: "nights, all planned" },
    { value: "2", label: "countries" },
    { value: "5", label: "stops" },
    { value: "2", label: "day trips" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Book Pena palace and the Alcázar online. Both have timed entry.", "A one-way hire car from Portugal to Spain costs extra. Ask when you book."] },
    { topic: "transport", title: "Driving", lines: ["Portuguese motorways have electronic tolls. Get the hire car's toll device."] },
    { topic: "money", title: "Money", lines: ["Cards work almost everywhere.", "Tipping is small: round up, or a coin or two."] },
    { topic: "weather", title: "Weather", lines: ["Seville is very hot in July and August. Spring and autumn are best."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. Two cities, then the car for the south." },
    { label: "Late nights", text: "Spain eats at 21:00 or later." },
  ],
};
