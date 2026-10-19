import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const UGANDA_AND_RWANDA: PresetDetail = {
  stops: [
    {
      place: "Entebbe",
      summary: "A night by Lake Victoria to land.",
      days: [day("Land at Entebbe", ["14:00 Airport to the lodge", "16:00 Botanical gardens", "19:00 Dinner by the lake"])],
    },
    {
      place: "Murchison Falls",
      summary: "The Nile forced through a gap seven metres wide.",
      days: [
        day("North to Murchison", ["07:00 Drive north, about 5h", "12:30 Rhinos on foot at Ziwa", "17:00 Arrive at the lodge"]),
        day("The falls", ["07:00 Game drive north of the Nile", "14:00 Boat up to the foot of the falls", "16:30 Walk to the top"], "The top of Murchison Falls"),
      ],
    },
    {
      place: "Kibale",
      summary: "The forest with the most chimpanzees in East Africa.",
      days: [
        day("South to Kibale", ["07:00 Drive south, about 6h", "15:00 Walk the crater lakes", "19:00 Dinner at the lodge"]),
        day("Chimpanzees", ["08:00 Chimp tracking in the forest", "14:00 Bigodi swamp walk", "17:00 ~ Free evening."], "Chimps in Kibale forest"),
      ],
    },
    {
      place: "Queen Elizabeth",
      summary: "Lions in the trees and hippos in the channel.",
      days: [
        day("To Queen Elizabeth", ["08:00 Drive to the park, about 3h", "14:00 Boat on the Kazinga channel", "18:00 Sunset at the lodge"]),
        day("Ishasha", ["07:00 Game drive to Ishasha for the tree-climbing lions", "13:00 Picnic lunch", "16:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "Bwindi",
      summary: "The impenetrable forest, and an hour with mountain gorillas.",
      days: [
        day("Into the forest", ["08:00 Drive to Bwindi, about 4h", "14:00 Walk to the waterfall", "19:00 Briefing for the morning"]),
        day("Gorillas", ["07:30 Gorilla tracking with the rangers", "12:00 One hour with the family", "16:00 Back at the lodge"], "An hour with mountain gorillas"),
      ],
    },
    {
      place: "Lake Bunyonyi",
      summary: "A quiet island lodge on the lake of little birds.",
      days: [day("The lake", ["09:00 Drive to Lake Bunyonyi, about 2h", "13:00 Canoe to the island", "16:00 ~ Free afternoon by the water."])],
    },
    {
      place: "Kigali",
      summary: "Over the border to Rwanda's calm, green capital.",
      days: [
        day("To Rwanda", ["08:00 Drive to Kigali, about 4h 30", "15:00 The genocide memorial", "19:30 Dinner in Kiyovu"]),
        day("Kigali", ["09:00 Kimironko market", "12:00 Inema arts centre", "16:00 ~ Free afternoon."]),
        day("Home from Kigali", ["10:00 Airport", "13:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "12", label: "nights, all planned" },
    { value: "2", label: "countries" },
    { value: "1", label: "gorilla permit" },
    { value: "4", label: "national parks" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Gorilla permits sell out months ahead. The price is in the trip.", "An East Africa tourist visa covers both countries."] },
    { topic: "health", title: "Health", lines: ["You need a yellow fever certificate. Talk to a travel clinic.", "You cannot track gorillas with a cold. Rangers turn back anyone ill."] },
    { topic: "transport", title: "Roads", lines: ["Long drives on rough roads. The guide sets the pace."] },
    { topic: "customs", title: "Rwanda", lines: ["Plastic bags are banned in Rwanda. Leave them at home."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Long drives between the parks." },
    { label: "Walking", text: "Gorilla tracking can mean hours on steep, muddy slopes." },
  ],
};
