import { day } from "../../day";
import { at, swap } from "../../ideas";
import type { PresetDetail } from "../../preset-detail-types";

export const RAJASTHAN_FORTS_AND_PALACES: PresetDetail = {
  stops: [
    {
      place: "Delhi",
      summary: "Old Delhi by rickshaw, New Delhi by car, and a day to land.",
      days: [
        day("Land in Delhi", ["14:00 Airport to the hotel", "17:00 Humayun's tomb at golden hour", "20:00 Dinner in Khan market"]),
        day("Old Delhi", ["08:00 Jama Masjid", "09:30 Rickshaw through Chandni Chowk", "13:00 Paratha lane for lunch", "16:00 Red Fort"]),
        day("New Delhi", ["09:00 Qutub Minar", "12:00 Lodhi gardens", "15:00 ~ Free afternoon.", "19:30 Dinner at a dhaba"]),
      ],
    },
    {
      place: "Agra",
      summary: "One night for the Taj at sunset and at sunrise.",
      days: [day("Train to Agra", ["08:00 Gatimaan express, about 2h", "11:00 Agra fort", "17:00 The Taj from Mehtab Bagh, across the river"])],
    },
    {
      place: "Jaipur",
      summary: "The pink city: the Amber fort, the wind palace and the bazaars.",
      days: [
        day("Taj at sunrise, then west", ["06:00 * The Taj Mahal at sunrise", "09:30 Breakfast, then the drive to Jaipur", "13:00 Fatehpur Sikri on the way", "19:00 Dinner in the pink city"], "The Taj Mahal at sunrise"),
        day("Amber fort", ["08:00 Amber fort before the heat", "13:00 Lunch", "15:00 City palace and Jantar Mantar", "18:00 Hawa Mahal from a rooftop café"]),
        day("Bazaars and block printing", ["09:00 Block printing workshop in Bagru", "14:00 Johari bazaar", "19:00 Dinner at a haveli"]),
      ],
    },
    {
      place: "Pushkar",
      summary: "The holy lake, the ghats and a slower pace.",
      days: [
        day("To the holy lake", ["09:00 Drive to Pushkar, about 3h", "14:00 Walk the ghats", "18:00 Aarti on the lake at dusk"]),
        day("Pushkar, slow", ["06:30 Walk up to Savitri temple for sunrise", "10:00 ~ Free day in the bazaar.", "19:00 Rooftop dinner"]),
      ],
    },
    {
      place: "Jodhpur",
      summary: "The blue city under Mehrangarh.",
      days: [
        day("To the blue city", ["08:30 Drive to Jodhpur, about 4h 30", "15:00 Walk the blue lanes", "18:30 Sunset by the stepwell"]),
        day("Mehrangarh", ["08:30 * Mehrangarh fort", "11:30 Zipline over the walls, if you like", "14:00 Jaswant Thada", "19:00 Dinner looking up at the fort"], "Mehrangarh fort above the blue city"),
      ],
    },
    {
      place: "Udaipur",
      summary: "Lakes, palaces and a fort on the hills for the last days.",
      days: [
        day("Ranakpur on the way", ["08:00 Drive towards Udaipur", "11:00 The marble Jain temple at Ranakpur", "17:00 Arrive in Udaipur"]),
        day("Palace and lake", ["09:00 City palace", "16:30 * Boat on Lake Pichola", "19:30 Dinner by the water"], "A boat on Lake Pichola"),
        day("Kumbhalgarh", ["08:00 Drive to Kumbhalgarh, about 2h", "10:30 Walk the great wall", "17:00 Back in Udaipur"]),
        day("Home from Udaipur", ["09:00 Flight to Delhi", "14:00 Connect home"]),
      ],
    },
  ],
  inPlan: [
    { value: "14", label: "nights, all planned" },
    { value: "6", label: "stops" },
    { value: "1", label: "train ride" },
    { value: "5", label: "forts and palaces" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Most passports need an e-visa. Apply a few weeks ahead.", "Book the Agra train early. Morning trains fill up."] },
    { topic: "transport", title: "Drives", lines: ["A car with a driver covers Agra to Udaipur. Allow extra time on the roads.", "Start early to beat the traffic."] },
    { topic: "health", title: "Food and water", lines: ["Drink bottled or filtered water only.", "Talk to a travel clinic about vaccines well before you go."] },
    { topic: "weather", title: "Weather", lines: ["October to March is the cooler season.", "Mornings can be cold in December and January."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. Six stops in fourteen nights." },
    { label: "Driving", text: "Four drives of three to five hours." },
    { label: "Walking", text: "Forts mean ramps and steps. Wear good shoes." },
  ],
  ideas: {
    atStops: [
      at("Delhi", [
        ["Rickshaw through Old Delhi to Jama Masjid", "Relaxed", "Low"],
        ["Humayun's tomb", "Relaxed", "Low"],
        ["Street food walk in Chandni Chowk", "Relaxed", "Low"],
      ]),
      at("Agra", [
        ["The Taj at sunset from Mehtab Bagh", "Relaxed", "Low"],
        ["Fatehpur Sikri on the way", "Steady", "Low"],
      ]),
      at("Jaipur", [
        ["Hot-air balloon at dawn", "Relaxed", "High"],
        ["Block printing at Bagru", "Relaxed", "Low"],
        ["Nahargarh fort at sunset", "Steady", "Low"],
      ]),
      at("Pushkar", [
        ["Walk up to Savitri temple", "Active", "Free"],
        ["Camel ride at sunset", "Relaxed", "Low"],
      ]),
      at("Jodhpur", [
        ["Zip line at Mehrangarh", "Active", "Mid"],
        ["Toorji stepwell and the blue lanes", "Relaxed", "Free"],
      ]),
      at("Udaipur", [
        ["Cooking class", "Relaxed", "Low"],
        ["Boat on Lake Pichola", "Relaxed", "Low"],
        ["Monsoon Palace at sunset", "Relaxed", "Low"],
      ]),
    ],
    otherStops: [
      swap("Ranthambore", 2, "Pushkar", "Tiger safaris in a park with a ruined fort."),
      swap("Jaisalmer", 2, "Jodhpur", "A golden fort in the Thar desert, and a night in the dunes."),
    ],
  },
};
