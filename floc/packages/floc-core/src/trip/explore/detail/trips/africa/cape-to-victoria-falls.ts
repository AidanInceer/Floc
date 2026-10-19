import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const CAPE_TO_VICTORIA_FALLS: PresetDetail = {
  stops: [
    {
      place: "Cape Town",
      summary: "Table Mountain, the penguins and Cape Point.",
      days: [
        day("Land in Cape Town", ["13:00 Airport to the hotel", "16:00 Cable car up Table Mountain", "19:30 Dinner at the waterfront"]),
        day("Cape Point", ["08:30 Chapman's Peak drive", "11:00 Penguins at Boulders beach", "14:00 Cape Point and the lighthouse"]),
        day("Cape Town, free", ["09:00 Bo-Kaap and the company's garden", "12:00 ~ Free afternoon.", "19:00 Dinner in Kloof street"]),
      ],
    },
    {
      place: "Windhoek",
      summary: "A night to meet the truck and the guide.",
      days: [day("Fly to Namibia", ["09:00 Flight to Windhoek, 2h", "14:00 Meet the guide, load the truck", "19:00 Joe's Beerhouse"])],
    },
    {
      place: "Sossusvlei",
      summary: "The red dunes and the dead trees of Deadvlei.",
      days: [
        day("South to the dunes", ["08:00 Drive south, about 5h", "15:00 Sesriem canyon", "18:00 Sunset over the desert"]),
        day("Dune 45 at sunrise", ["05:00 Into the park at the gate", "06:00 Climb Dune 45 for sunrise", "09:00 Walk to Deadvlei", "15:00 ~ Free afternoon at camp."], "Dune 45 at sunrise"),
      ],
    },
    {
      place: "Swakopmund",
      summary: "The coast: sand, sea and a sandwich harbour.",
      days: [
        day("To the coast", ["08:00 Drive through the Kuiseb canyon", "13:00 Walvis Bay flamingos", "16:00 Arrive in Swakopmund"]),
        day("Swakopmund", ["09:00 Sandwich harbour by 4x4", "15:00 ~ Free afternoon.", "19:00 Seafood dinner"]),
      ],
    },
    {
      place: "Etosha",
      summary: "Three days of waterholes on the great white pan.",
      days: [
        day("North to Etosha", ["08:00 Drive north, about 5h", "15:00 First game drive", "20:00 The floodlit waterhole at Okaukuejo"]),
        day("Etosha east", ["06:30 Game drive across the pan", "12:00 Lunch at Halali", "16:00 Waterhole until dark"]),
        day("Etosha, slow", ["06:30 Dawn game drive", "11:00 ~ Free day at camp.", "19:00 Night at the waterhole"]),
      ],
    },
    {
      place: "Okavango Delta",
      summary: "A camp on the water, by mokoro and on foot.",
      days: [
        day("Fly to the delta", ["09:00 Light aircraft to the delta, 2h 30", "15:00 First mokoro out", "19:00 Dinner by the fire"]),
        day("Mokoro", ["06:30 Mokoro through the channels", "11:00 Back at camp", "16:00 Walk on an island"], "A mokoro through the Okavango"),
        day("The delta on foot", ["06:00 Bush walk with a tracker", "12:00 ~ Free afternoon.", "17:00 Sundowners on the water"]),
      ],
    },
    {
      place: "Chobe",
      summary: "Elephants by the hundred, from a boat on the river.",
      days: [
        day("To Chobe", ["09:00 Flight to Kasane, 1h", "15:00 Sunset boat on the Chobe river"]),
        day("Chobe", ["06:00 Game drive in the park", "12:00 Lunch by the river", "15:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "Victoria Falls",
      summary: "The falls, the gorge and a last sunset on the Zambezi.",
      days: [
        day("Over the border", ["09:00 Drive to Victoria Falls, 1h 30", "14:00 Walk the falls, in the spray", "18:00 Dinner at the hotel"], "The spray of Victoria Falls"),
        day("The gorge", ["09:00 Helicopter over the falls, if you like", "13:00 ~ Free afternoon.", "16:30 Sunset cruise on the Zambezi"]),
        day("Home from Victoria Falls", ["10:00 Airport", "13:00 Flight home via Johannesburg"]),
      ],
    },
  ],
  inPlan: [
    { value: "18", label: "nights, all planned" },
    { value: "4", label: "countries" },
    { value: "8", label: "stops" },
    { value: "3", label: "flights" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Check the entry rules for all four countries for your passport.", "Light aircraft to the delta allow 20kg in a soft bag."] },
    { topic: "health", title: "Health", lines: ["Talk to a travel clinic about malaria tablets for the north.", "Drink bottled water in Namibia's desert. Carry plenty."] },
    { topic: "money", title: "Money", lines: ["Rand works in Namibia too. Zimbabwe takes US dollars.", "Tipping guides and trackers is expected."] },
    { topic: "weather", title: "Weather", lines: ["Dry season, May to October, is best for game.", "Desert mornings are cold. Bring a fleece."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Long. Eight stops, early starts for the game drives." },
    { label: "Driving", text: "Four drives of four to five hours in Namibia." },
  ],
};
