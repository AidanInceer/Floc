import { day } from "../../day";
import { at, swap } from "../../ideas";
import type { PresetDetail } from "../../preset-detail-types";

export const MASAI_MARA_TO_ZANZIBAR: PresetDetail = {
  stops: [
    {
      place: "Nairobi",
      summary: "A night to land, with the baby elephants of the Sheldrick trust.",
      days: [day("Land in Nairobi", ["11:00 Sheldrick elephant orphanage at feeding time", "14:00 Karen Blixen's house", "19:00 Dinner at the hotel"])],
    },
    {
      place: "Masai Mara",
      summary: "Three dawns in the Mara, and the river if the herds are crossing.",
      days: [
        day("Fly into the Mara", ["08:00 Light aircraft, 1h", "11:00 Lunch at camp", "16:00 First game drive"]),
        day("The river", ["06:00 * Dawn game drive", "10:00 Wait at the Mara river for a crossing", "17:00 Sundowners on a ridge"], "Dawn game drives in the Mara"),
        day("A Maasai village", ["06:00 Dawn game drive", "11:00 Visit a Maasai village", "15:00 ~ Free afternoon at camp."]),
      ],
    },
    {
      place: "Serengeti",
      summary: "Over the border to the open plains of the Serengeti.",
      days: [
        day("To the Serengeti", ["08:00 Flight to the Serengeti, 1h 30", "13:00 Lunch at camp", "16:00 Game drive on the plains"]),
        day("Big cats", ["06:00 Dawn drive to the kopjes", "12:00 Picnic lunch in the park", "16:00 Back at camp"]),
        day("Serengeti, slow", ["06:30 Balloon over the plains, if you like", "11:00 ~ Free day at camp.", "17:00 Evening drive"]),
      ],
    },
    {
      place: "Ngorongoro",
      summary: "Down into the crater, the world's largest unbroken caldera.",
      days: [
        day("To the crater rim", ["08:00 Drive to Ngorongoro, about 4h", "13:00 Olduvai gorge", "18:00 Sunset on the rim"]),
        day("Into the crater", ["06:00 * Down into the crater at first light", "12:00 Lunch by the hippo pool", "16:00 Back up to the rim"], "Down into the Ngorongoro crater"),
      ],
    },
    {
      place: "Stone Town",
      summary: "The old trading town of Zanzibar: doors, spice and the sea.",
      days: [
        day("Fly to Zanzibar", ["09:00 Drive to Arusha airport", "12:00 Flight to Zanzibar, 1h 30", "18:00 Forodhani night market"]),
        day("Spice and Stone Town", ["09:00 A spice farm", "14:00 * Walk Stone Town's lanes and doors", "18:00 Sunset dhow"], "Stone Town's spice market"),
      ],
    },
    {
      place: "Paje",
      summary: "Three beach days on the east coast.",
      days: [
        day("To the beach", ["10:00 Drive to Paje, 1h", "14:00 Swim in the lagoon", "19:00 Seafood on the sand"]),
        day("The reef", ["09:00 Snorkel at Mnemba atoll", "15:00 ~ Free afternoon."]),
        day("Paje, free", ["10:00 ~ Nothing planned at all.", "19:00 Last dinner by the sea"]),
        day("Home from Zanzibar", ["09:00 Airport", "12:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "14", label: "nights, all planned" },
    { value: "2", label: "countries" },
    { value: "8", label: "game drives" },
    { value: "3", label: "beach days" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Kenya and Tanzania both need an e-visa or travel authorisation before you fly.", "Light aircraft allow 15kg in a soft bag."] },
    { topic: "health", title: "Health", lines: ["Talk to a travel clinic about malaria tablets and yellow fever.", "Drink bottled water."] },
    { topic: "money", title: "Money", lines: ["US dollars are used for park fees and tips.", "Tip guides and camp staff at the end of each stay."] },
    { topic: "customs", title: "Zanzibar", lines: ["Zanzibar is mostly Muslim. Cover shoulders and knees in Stone Town."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Early starts on safari, then slow on the beach." },
    { label: "Driving", text: "One long drive to the crater. Roads are rough." },
  ],
  ideas: {
    atStops: [
      at("Nairobi", [
        ["Giraffe Centre", "Relaxed", "Low"],
        ["Elephant orphans at the Sheldrick trust, 11:00", "Relaxed", "Low"],
        ["Nairobi National Park at dawn", "Relaxed", "Mid"],
      ]),
      at("Masai Mara", [
        ["Balloon over the Mara at sunrise", "Relaxed", "High"],
        ["Walking safari with a ranger", "Steady", "Mid"],
        ["A Maasai village", "Relaxed", "Low"],
      ]),
      at("Serengeti", [
        ["A full day following the herds", "Relaxed", "Mid"],
        ["Bush dinner under the stars", "Relaxed", "High"],
      ]),
      at("Ngorongoro", [
        ["Walk on the crater rim with a ranger", "Steady", "Mid"],
        ["Coffee farm at Karatu", "Relaxed", "Low"],
      ]),
      at("Stone Town", [
        ["Spice farm tour", "Relaxed", "Low"],
        ["Giant tortoises on Prison Island", "Relaxed", "Low"],
        ["Forodhani night food market", "Relaxed", "Low"],
      ]),
      at("Paje", [
        ["Kitesurf lesson", "Active", "Mid"],
        ["Snorkel at Mnemba atoll", "Steady", "Mid"],
        ["Red colobus monkeys in Jozani forest", "Steady", "Low"],
      ]),
    ],
    otherStops: [
      swap("Lake Manyara", 1, "Ngorongoro", "Tree-climbing lions, flamingos and a forest drive."),
      swap("Nungwi", 3, "Paje", "The north tip: swimming at any tide and dhow sunsets."),
    ],
  },
};
