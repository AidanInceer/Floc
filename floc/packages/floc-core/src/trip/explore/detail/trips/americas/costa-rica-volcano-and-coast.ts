import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const COSTA_RICA_VOLCANO_AND_COAST: PresetDetail = {
  stops: [
    {
      place: "San José",
      summary: "One night to land.",
      days: [day("Land in San José", ["15:00 Airport to the hotel", "18:00 Dinner at a soda"])],
    },
    {
      place: "Tortuguero",
      summary: "Canals, a village with no roads and turtles on the beach.",
      days: [
        day("By road and river", ["06:30 Bus to the river landing", "10:30 Boat up the canals", "20:00 * Turtle walk on the beach, in season"], "Turtles nesting at Tortuguero"),
        day("The canals", ["06:00 Canoe through the canals", "10:00 Village walk", "14:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "La Fortuna",
      summary: "Arenal volcano, hanging bridges and hot springs.",
      days: [
        day("To Arenal", ["07:00 Boat back, then the drive to La Fortuna", "15:00 Check in under the volcano", "19:00 * Hot springs at night"], "Hot springs under Arenal"),
        day("Bridges and falls", ["07:30 Arenal hanging bridges", "12:00 La Fortuna waterfall", "16:00 ~ Free afternoon."]),
        day("The volcano", ["08:00 Walk the 1968 lava trail", "13:00 Lunch", "15:00 Kayak on Lake Arenal"]),
      ],
    },
    {
      place: "Monteverde",
      summary: "The cloud forest: bridges, quetzals and a night walk.",
      days: [
        day("Up to the cloud forest", ["09:00 Drive round the lake to Monteverde, about 3h", "15:00 Coffee farm tour", "18:30 Night walk"]),
        day("Cloud forest", ["07:00 Monteverde reserve with a guide", "12:00 Lunch in Santa Elena", "14:00 * Sky bridges"], "Cloud forest bridges at Monteverde"),
      ],
    },
    {
      place: "Manuel Antonio",
      summary: "A beach house, the park and sloths if you are lucky.",
      days: [
        day("Down to the Pacific", ["09:00 Drive to Manuel Antonio, about 4h", "15:00 Swim at Playa Espadilla", "18:00 Sunset from the house"]),
        day("The park", ["07:00 Manuel Antonio park with a guide", "11:00 Swim at Playa Manuel Antonio", "15:00 ~ Free afternoon."]),
        day("Catamaran", ["09:00 Catamaran and snorkel", "14:00 ~ Free afternoon.", "19:00 Last dinner by the sea"]),
        day("Home from San José", ["08:00 Drive to the airport, about 3h 30", "14:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "11", label: "nights, all planned" },
    { value: "5", label: "stops" },
    { value: "2", label: "boat rides" },
    { value: "4", label: "guided walks" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Check the entry rules for your passport.", "Turtle nesting runs July to October. Other months, the canals are the draw."] },
    { topic: "money", title: "Money", lines: ["US dollars work almost everywhere. Change comes in colones.", "Tips are often in the bill already."] },
    { topic: "health", title: "Sun and bugs", lines: ["Repellent at dusk, sun cream at all times."] },
    { topic: "weather", title: "Weather", lines: ["December to April is dry. The cloud forest is cool, bring a layer."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. Five stops, one long travel day to Tortuguero." },
    { label: "Wildlife", text: "Guides find far more than you will. Book them." },
  ],
};
