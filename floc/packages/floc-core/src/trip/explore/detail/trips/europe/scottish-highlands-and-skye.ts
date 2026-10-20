import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const SCOTTISH_HIGHLANDS_AND_SKYE: PresetDetail = {
  stops: [
    {
      place: "Edinburgh",
      summary: "The old town, the castle and Arthur's Seat.",
      days: [
        day("Arrive in Edinburgh", ["14:00 Tram from the airport", "16:00 The Royal Mile", "19:00 Dinner in the Grassmarket"]),
        day("Castle and the seat", ["09:30 Edinburgh castle", "13:00 Lunch in Stockbridge", "16:00 Up Arthur's Seat"]),
      ],
    },
    {
      place: "Glencoe",
      summary: "The great glen of the west, and a walk into the lost valley.",
      days: [
        day("North by Loch Lomond", ["09:00 Pick up the car", "11:00 Loch Lomond", "15:00 Rannoch Moor", "18:00 * Arrive in Glencoe"], "Glencoe's three sisters"),
        day("The lost valley", ["09:00 Walk into the lost valley", "14:00 Lunch at the Clachaig inn", "16:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "Isle of Skye",
      summary: "The Storr, the Quiraing and the fairy pools.",
      days: [
        day("Over the sea to Skye", ["09:00 Drive by Eilean Donan castle", "14:00 Over the bridge to Skye", "18:00 Dinner in Portree"]),
        day("The Trotternish ridge", ["08:00 * The Old Man of Storr", "12:00 The Quiraing", "16:00 Kilt Rock"], "The Old Man of Storr"),
        day("Fairy pools", ["10:00 The fairy pools", "13:00 Talisker distillery", "16:00 ~ Free evening."]),
      ],
    },
    {
      place: "Torridon",
      summary: "A cottage under the mountains, and the pass to Applecross.",
      days: [
        day("To Torridon", ["10:00 Drive north, about 2h 30", "14:00 Walk by Loch Torridon", "19:00 Dinner at the inn"]),
        day("Applecross", ["09:00 * Drive the Bealach na Bà", "12:00 Seafood at the Applecross inn", "15:00 The coast road back"], "Applecross by the Bealach na Bà"),
      ],
    },
    {
      place: "Inverness",
      summary: "Loch Ness on the last day, then home.",
      days: [
        day("East to Inverness", ["10:00 Drive to Inverness, about 2h", "14:00 Loch Ness and Urquhart castle", "19:00 Dinner by the river"]),
        day("Home from Inverness", ["09:00 Return the car", "11:00 Flight or train home"]),
      ],
    },
  ],
  inPlan: [
    { value: "10", label: "nights, all planned" },
    { value: "5", label: "stops" },
    { value: "4", label: "walks" },
    { value: "1", label: "distillery" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Skye fills up in summer. Book beds early.", "Single-track roads: use the passing places, and let cars by."] },
    { topic: "weather", title: "Weather", lines: ["Rain on any day. Pack waterproofs and good boots.", "Midges in summer. Bring repellent."] },
    { topic: "health", title: "On the hills", lines: ["Tell someone your route, and turn back if the cloud comes in."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. One car, drives of two to three hours." },
    { label: "Walking", text: "Most days have a walk. None needs a summit." },
  ],
};
