import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const NEW_ZEALAND_SOUTH_ISLAND: PresetDetail = {
  stops: [
    {
      place: "Christchurch",
      summary: "A night to land and pick up the van.",
      days: [day("Land in Christchurch", ["14:00 Airport, pick up the van", "16:00 The botanic gardens", "19:00 Dinner on New Regent street"])],
    },
    {
      place: "Lake Tekapo",
      summary: "The blue lake, the little church and the darkest sky.",
      days: [
        day("Across the plains", ["09:00 Drive to Tekapo, about 3h", "13:00 Church of the Good Shepherd", "21:30 * Stargazing on Mount John"], "Stargazing at Tekapo"),
        day("Tekapo", ["09:00 Walk up Mount John", "13:00 ~ Free afternoon.", "18:00 Hot pools"]),
      ],
    },
    {
      place: "Aoraki / Mount Cook",
      summary: "One night under the highest mountain.",
      days: [day("The Hooker valley", ["09:00 Drive along Lake Pukaki", "11:00 Walk the Hooker valley track", "17:00 Tasman glacier lake"])],
    },
    {
      place: "Wanaka",
      summary: "A lake town with Roys Peak above it.",
      days: [
        day("Over the Lindis pass", ["09:00 Drive to Wanaka, about 2h 30", "14:00 The Wanaka tree", "18:00 Dinner by the lake"]),
        day("Roys Peak", ["06:00 Climb Roys Peak", "13:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "Queenstown",
      summary: "The adventure town, and a day at Milford Sound.",
      days: [
        day("To Queenstown", ["10:00 Drive over the Crown range, 1h", "13:00 Arrowtown", "18:00 Gondola for sunset"]),
        day("Milford Sound", ["07:00 Drive to Milford Sound", "11:00 * Cruise the sound", "18:00 Back in Queenstown"], "Milford Sound before the coaches"),
        day("Queenstown, free", ["10:00 ~ Free day. Jet boat, bungy or the lake.", "19:00 Dinner in town"]),
      ],
    },
    {
      place: "Franz Josef",
      summary: "Up the wild west coast to the glacier.",
      days: [
        day("The Haast pass", ["08:00 Drive the Haast pass, about 5h 30", "12:00 Blue pools", "17:00 Arrive in Franz Josef"]),
        day("The glacier", ["09:00 Heli-hike on the glacier, if you like", "14:00 Lake Matheson walk", "17:00 ~ Free evening."]),
      ],
    },
    {
      place: "Christchurch",
      summary: "Back over the Alps on the TranzAlpine.",
      days: [
        day("The TranzAlpine", ["08:00 Drive to Greymouth, return the van", "13:45 * TranzAlpine over Arthur's Pass", "18:30 Into Christchurch"], "The TranzAlpine over Arthur's Pass"),
        day("Christchurch, free", ["10:00 ~ Nothing planned.", "19:00 Last dinner"]),
        day("Home from Christchurch", ["09:00 Airport", "11:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "13", label: "nights, all planned" },
    { value: "7", label: "stops" },
    { value: "1", label: "train ride" },
    { value: "4", label: "walks" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Most passports need an NZeTA before you fly.", "Book the TranzAlpine and the Milford cruise ahead in summer."] },
    { topic: "transport", title: "Driving", lines: ["Drive on the left. Many bridges are one lane.", "Fill up before the Haast pass. Fuel is far apart."] },
    { topic: "weather", title: "Weather", lines: ["Four seasons in a day. Pack a waterproof and a warm layer.", "The west coast is wet. That is why it is green."] },
    { topic: "customs", title: "Biosecurity", lines: ["Declare food and clean your boots before you land."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "On the move. Seven stops, some long drives." },
    { label: "Walking", text: "One steep climb, Roys Peak, and it is optional." },
  ],
};
