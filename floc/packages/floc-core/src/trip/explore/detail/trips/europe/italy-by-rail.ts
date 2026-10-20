import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const ITALY_BY_RAIL: PresetDetail = {
  stops: [
    {
      place: "Venice",
      summary: "The canals at dawn and the islands of the lagoon.",
      days: [
        day("Land in Venice", ["13:00 Water bus from the airport", "16:00 Walk to the Rialto", "19:30 Cicchetti in Cannaregio"]),
        day("San Marco and the islands", ["07:30 Piazza San Marco before the crowds", "10:00 The basilica", "14:00 Boat to Burano", "19:00 Dinner on the Zattere"]),
      ],
    },
    {
      place: "Florence",
      summary: "The Uffizi, the Duomo, Oltrarno and a day in Siena.",
      days: [
        day("Fast train to Florence", ["10:00 Frecciarossa, about 2h 15", "14:00 The Duomo and its dome", "19:30 Bistecca in Santo Spirito"]),
        day("The Uffizi", ["08:15 * The Uffizi at opening time", "13:00 Lunch in Mercato Centrale", "18:00 Piazzale Michelangelo for sunset"], "The Uffizi at opening time"),
        day("Siena", ["09:00 Drive to Siena", "11:00 Il Campo and the cathedral", "16:00 A Chianti winery on the way back"]),
      ],
    },
    {
      place: "Cinque Terre",
      summary: "Five villages on the cliffs, walked and swum.",
      days: [
        day("To the coast", ["10:00 Train to La Spezia, then Vernazza", "15:00 Swim off the rocks", "19:30 Dinner by the harbour"]),
        day("The cliff path", ["08:00 Walk Vernazza to Monterosso", "13:00 Lunch on the beach", "16:00 Train to Manarola for sunset"]),
      ],
    },
    {
      place: "Rome",
      summary: "The forum, the Vatican and Trastevere.",
      days: [
        day("South to Rome", ["10:00 Train to Rome, about 4h", "16:00 The Pantheon and Piazza Navona", "20:00 Cacio e pepe in Trastevere"]),
        day("Ancient Rome", ["08:30 The Colosseum", "10:30 The forum and the Palatine", "17:00 ~ Free evening."]),
        day("The Vatican", ["08:00 The Vatican museums and the Sistine chapel", "12:00 St Peter's", "19:30 Dinner in Monti"]),
      ],
    },
    {
      place: "Naples",
      summary: "Pizza where it began, and Pompeii.",
      days: [day("Naples and Pompeii", ["09:00 Train to Naples, 1h 10", "11:00 Train to Pompeii", "16:00 Back in Naples", "19:30 Pizza at a Spaccanapoli original"])],
    },
    {
      place: "Positano",
      summary: "A terrace on the Amalfi coast, the Path of the Gods and a day on Capri.",
      days: [
        day("By sea to Positano", ["10:00 Ferry from Naples, about 1h 30", "14:00 Check in, then swim", "20:00 Dinner on the terrace"]),
        day("Path of the Gods", ["08:30 Bus to Bomerano", "09:00 * Walk the Path of the Gods downhill", "14:00 Lunch in Nocelle"], "Path of the Gods, walked downhill"),
        day("Capri", ["09:00 Ferry to Capri", "11:00 * Boat round the island", "14:00 Anacapri and Monte Solaro"], "A day on Capri"),
        day("Home from Naples", ["08:00 Driver to Naples airport", "12:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "14", label: "nights, all planned" },
    { value: "6", label: "stops" },
    { value: "5", label: "train rides" },
    { value: "3", label: "day trips" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Book the Uffizi, the Vatican and the Colosseum online. Timed tickets sell out.", "Book the fast trains early for the best fares."] },
    { topic: "transport", title: "Trains", lines: ["Regional tickets must be validated before you board.", "Ferries on the Amalfi coast run April to October."] },
    { topic: "money", title: "Money", lines: ["Cards work almost everywhere. Keep coins for coffee at the bar.", "A cover charge on the bill is normal."] },
    { topic: "customs", title: "Churches", lines: ["Cover shoulders and knees in churches and at the Vatican."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "On the move. Six stops, every move by train or boat." },
    { label: "Walking", text: "A lot, and the coast is all steps." },
  ],
};
