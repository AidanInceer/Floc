import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const SRI_LANKA_ROAD_AND_RAIL: PresetDetail = {
  stops: [
    {
      place: "Colombo",
      summary: "One night to land, by the sea.",
      days: [day("Land in Colombo", ["13:00 Airport to the hotel", "16:00 Walk Galle Face green", "19:00 Hoppers and curry in Pettah"])],
    },
    {
      place: "Sigiriya",
      summary: "The lion rock at first light, and the old city of Polonnaruwa.",
      days: [
        day("Into the dry zone", ["08:00 Drive north, about 4h", "13:00 Dambulla cave temples", "18:00 Village dinner"]),
        day("Sigiriya and Polonnaruwa", ["06:30 Climb Sigiriya rock before the heat", "12:00 Lunch", "14:00 The ruins of Polonnaruwa by bike"], "Sigiriya rock at first light"),
      ],
    },
    {
      place: "Kandy",
      summary: "The temple of the tooth and the botanic gardens.",
      days: [
        day("Hill country", ["08:30 Drive to Kandy, about 2h 30", "14:00 Peradeniya botanic gardens", "18:30 Evening puja at the temple of the tooth"]),
        day("Kandy, free", ["09:00 Walk round the lake", "11:00 ~ Free day.", "18:00 Kandyan dance"]),
      ],
    },
    {
      place: "Ella",
      summary: "The blue train through the tea, and walks above the valley.",
      days: [
        day("The hill line", ["08:45 Train to Ella, about 7h through the tea", "16:00 Arrive in Ella", "19:00 Dinner in the village"], "The train from Kandy to Ella"),
        day("Little Adam's peak", ["06:30 Walk up Little Adam's peak", "10:00 Nine Arches bridge", "14:00 Tea factory tour"]),
      ],
    },
    {
      place: "Yala",
      summary: "Two game drives in the park with the most leopards.",
      days: [
        day("Down to the plains", ["09:00 Drive to Yala, about 2h 30", "14:30 Afternoon game drive", "19:30 Dinner at the camp"]),
        day("Leopards", ["05:30 Dawn game drive", "11:00 Back at camp", "15:00 ~ Free afternoon by the pool."], "Leopards in Yala"),
      ],
    },
    {
      place: "Galle",
      summary: "The Dutch fort, the beaches of the south and whales off Mirissa.",
      days: [
        day("To the fort", ["09:00 Drive to Galle, about 3h", "15:00 Walk the ramparts", "18:00 Sunset from the lighthouse"]),
        day("Whales off Mirissa", ["06:30 Whale-watching boat from Mirissa", "13:00 Lunch on the beach", "16:00 Swim at Jungle beach"]),
        day("Galle, free", ["10:00 ~ Nothing planned. Beach or fort.", "19:00 Last dinner in the fort"]),
        day("Home from Colombo", ["08:00 Drive to the airport, about 2h 30", "13:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "12", label: "nights, all planned" },
    { value: "6", label: "stops" },
    { value: "1", label: "train ride" },
    { value: "3", label: "game drives" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Most passports need an online travel authorisation before you fly.", "Reserve the Kandy to Ella train seats as soon as they open."] },
    { topic: "customs", title: "Temples", lines: ["Cover shoulders and knees, and take shoes and hats off.", "Never pose with your back to a Buddha."] },
    { topic: "health", title: "Health", lines: ["Drink bottled water. Use repellent at dusk.", "Talk to a travel clinic about vaccines well before you go."] },
    { topic: "weather", title: "Weather", lines: ["December to April is dry in the south and the hills.", "The hill country is cool at night. Bring a layer."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. Six stops, one day on the train." },
    { label: "Early starts", text: "Sigiriya, Yala and the whales all start before 07:00." },
  ],
};
