import { day } from "../../day";
import { at, swap } from "../../ideas";
import type { PresetDetail } from "../../preset-detail-types";

export const ICELAND_RING_ROAD: PresetDetail = {
  stops: [
    {
      place: "Reykjavík",
      summary: "Pick up the car, then the Golden Circle on the way out.",
      days: [day("Land and the Golden Circle", ["09:00 Keflavík, pick up the car", "11:00 Þingvellir, between the plates", "14:00 Geysir and Gullfoss", "19:00 Dinner in Reykjavík"])],
    },
    {
      place: "Vík",
      summary: "Waterfalls and the black beach on the south coast.",
      days: [day("The south coast", ["09:00 Drive east on Route 1", "11:00 Seljalandsfoss, walk behind it", "13:00 Skógafoss", "17:00 Reynisfjara black beach"])],
    },
    {
      place: "Höfn",
      summary: "The glacier lagoon, the diamond beach and a walk on the ice.",
      days: [
        day("To the glacier lagoon", ["09:00 Drive east through the lava fields", "13:00 * Jökulsárlón glacier lagoon", "15:00 Diamond beach", "19:00 Langoustine in Höfn"], "Jökulsárlón glacier lagoon"),
        day("On the ice", ["09:30 Guided glacier walk at Skaftafell", "14:00 Svartifoss", "17:00 ~ Free evening."]),
      ],
    },
    {
      place: "Seyðisfjörður",
      summary: "One night in the east fjords, in a village at the end of the road.",
      days: [day("The east fjords", ["09:00 Coast road north through the fjords", "14:00 Over the pass to Seyðisfjörður", "17:00 The rainbow street and the blue church"])],
    },
    {
      place: "Mývatn",
      summary: "Craters, lava and hot water: the Diamond Circle.",
      days: [
        day("Over the highlands", ["09:00 Drive west across the plateau", "12:00 Dettifoss, the loudest waterfall", "17:00 * Mývatn nature baths"], "Mývatn and the Diamond Circle"),
        day("Around the lake", ["09:00 Hverir mud pots", "11:00 Krafla's crater", "14:00 Dimmuborgir lava walk", "17:00 ~ Free evening."]),
      ],
    },
    {
      place: "Akureyri",
      summary: "The north's small town, with Goðafoss on the way and whales in the fjord.",
      days: [day("Goðafoss and whales", ["09:00 Goðafoss", "13:00 Whale watching from Akureyri", "19:00 Dinner in town"])],
    },
    {
      place: "Snæfellsnes",
      summary: "The peninsula on the way back, then home.",
      days: [
        day("The long drive west", ["08:30 * Drive to Snæfellsnes, about 5h", "15:00 Kirkjufell", "17:00 Arnarstapi cliffs"], "Snæfellsnes on the way back"),
        day("Home", ["09:00 Drive to Keflavík, about 2h 30", "12:00 Return the car", "14:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "9", label: "nights, all planned" },
    { value: "7", label: "stops" },
    { value: "1", label: "whole loop of Route 1" },
    { value: "2", label: "hot baths" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Book guesthouses early. The east has very few beds.", "Check road.is each morning for closures."] },
    { topic: "transport", title: "Driving", lines: ["Fill up when you can. Fuel stations are far apart in the east.", "Never stop on the road for a photo. Use the lay-bys."] },
    { topic: "weather", title: "Weather", lines: ["It changes by the hour. Pack a waterproof and layers.", "Midnight sun in June and July. Bring an eye mask."] },
    { topic: "money", title: "Money", lines: ["Cards work almost everywhere. You may never need cash.", "Food is dear. Supermarket picnics save a lot."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "On the move. Most days are a drive of three to five hours." },
    { label: "Driving", text: "One car for the group. Share the wheel." },
  ],
  ideas: {
    atStops: [
      at("Reykjavík", [
        ["Sky Lagoon", "Relaxed", "High"],
        ["Up the Hallgrímskirkja tower", "Relaxed", "Low"],
      ]),
      at("Vík", [
        ["Glacier walk on Sólheimajökull", "Active", "High"],
        ["Puffins at Dyrhólaey, in summer", "Relaxed", "Free"],
      ]),
      at("Höfn", [
        ["Ice cave tour, in winter", "Steady", "High"],
        ["Langoustine dinner", "Relaxed", "High"],
        ["Stokksnes beach under Vestrahorn", "Relaxed", "Low"],
      ]),
      at("Seyðisfjörður", [
        ["Walk to Gufufoss", "Steady", "Free"],
        ["Kayak on the fjord", "Steady", "Mid"],
      ]),
      at("Mývatn", [
        ["Mývatn nature baths", "Relaxed", "Mid"],
        ["Walk the Hverfjall crater rim", "Active", "Free"],
      ]),
      at("Akureyri", [
        ["Whale watching from Húsavík", "Relaxed", "High"],
        ["Forest Lagoon", "Relaxed", "Mid"],
      ]),
      at("Snæfellsnes", [
        ["Coast path from Arnarstapi to Hellnar", "Steady", "Free"],
        ["Vatnshellir lava tube", "Steady", "Mid"],
      ]),
    ],
    otherStops: [
      swap("Westfjords", 3, "Snæfellsnes", "Long fjords, Dynjandi falls and the Látrabjarg bird cliffs."),
      swap("Landmannalaugar", 1, "Vík", "Coloured hills and a hot river, in summer only, by 4x4 bus."),
    ],
  },
};
