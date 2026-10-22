import { day } from "../../day";
import { at, swap } from "../../ideas";
import type { PresetDetail } from "../../preset-detail-types";

export const GREAT_OCEAN_ROAD_AND_ULURU: PresetDetail = {
  stops: [
    {
      place: "Melbourne",
      summary: "Lanes, coffee, the market and a game at the MCG if one is on.",
      days: [
        day("Land in Melbourne", ["13:00 SkyBus to the city", "16:00 The laneways and their murals", "19:30 Dinner in Chinatown"]),
        day("Markets and the bay", ["09:00 Queen Victoria market", "13:00 Tram to St Kilda", "17:00 Penguins at the pier at dusk"]),
        day("Melbourne, free", ["10:00 ~ Free day. Galleries, the MCG, or a long brunch.", "19:00 Rooftop bar"]),
      ],
    },
    {
      place: "Lorne",
      summary: "The start of the Great Ocean Road.",
      days: [day("The Great Ocean Road", ["09:00 Pick up the car", "11:00 Bells Beach", "14:00 The memorial arch", "17:00 Arrive in Lorne"])],
    },
    {
      place: "Port Campbell",
      summary: "Koalas, rainforest and the Twelve Apostles.",
      days: [day("To the Apostles", ["09:00 Koalas at Kennett river", "12:00 Rainforest at Maits Rest", "18:30 * The Twelve Apostles at sunset"], "The Twelve Apostles at sunset")],
    },
    {
      place: "Grampians",
      summary: "Sandstone ranges, kangaroos and rock art.",
      days: [
        day("Inland to the Grampians", ["09:00 Loch Ard gorge", "11:00 Drive north, about 3h", "17:00 Kangaroos on the oval at Halls Gap"]),
        day("The Pinnacle", ["08:00 Walk to the Pinnacle", "13:00 Brambuk cultural centre", "16:00 ~ Free afternoon."]),
      ],
    },
    {
      place: "Adelaide",
      summary: "A calm city, and a day in the Barossa.",
      days: [
        day("West to Adelaide", ["09:00 Drive to Adelaide, about 5h", "16:00 Return the car", "19:00 Central market dinner"]),
        day("The Barossa", ["09:30 Drive to the Barossa", "11:00 * Cellar doors", "13:00 Long lunch at a winery", "18:00 Back in Adelaide"], "Barossa cellar doors"),
      ],
    },
    {
      place: "Uluru",
      summary: "The red centre: the rock, Kata Tjuta and the stars.",
      days: [
        day("Fly to the centre", ["10:00 Flight to Uluru, 2h", "15:00 Base walk", "18:30 Sunset at the rock"]),
        day("Sunrise and Kata Tjuta", ["05:30 * Uluru at first light", "09:00 Cultural centre", "15:00 Valley of the Winds at Kata Tjuta"], "Uluru at first light"),
        day("Field of light", ["10:00 ~ Free day.", "19:30 Dinner under the stars", "21:00 Field of Light"]),
        day("Home from Uluru", ["11:00 Flight to Sydney", "16:00 Connect home"]),
      ],
    },
  ],
  inPlan: [
    { value: "12", label: "nights, all planned" },
    { value: "6", label: "stops" },
    { value: "1", label: "flight" },
    { value: "3", label: "sunsets planned" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Most passports need an ETA or eVisitor visa before you fly.", "Uluru's lodges are the only beds there. Book early."] },
    { topic: "health", title: "Heat and flies", lines: ["The centre is hot. Walk early and carry water.", "Bring a fly net for Uluru. You will use it."] },
    { topic: "transport", title: "Driving", lines: ["Drive on the left. Watch for kangaroos at dusk."] },
    { topic: "customs", title: "Uluru", lines: ["The rock is sacred to the Anangu. Climbing is closed, and some places ask for no photos."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. A road trip, then a flight to the centre." },
    { label: "Early starts", text: "Sunrise at Uluru means 05:30." },
  ],
  ideas: {
    atStops: [
      at("Melbourne", [
        ["NGV and Federation Square", "Relaxed", "Free"],
        ["AFL at the MCG", "Relaxed", "Mid"],
        ["Yarra Valley wineries for the day", "Relaxed", "High"],
      ]),
      at("Lorne", [
        ["Walk to Erskine falls", "Steady", "Free"],
        ["Surf lesson at Anglesea", "Active", "Mid"],
      ]),
      at("Port Campbell", [
        ["Down the Gibson Steps to the beach", "Steady", "Free"],
        ["Helicopter over the Apostles", "Relaxed", "High"],
      ]),
      at("Grampians", [
        ["Mackenzie falls", "Steady", "Free"],
        ["Rock climbing at Mount Arapiles", "Active", "Mid"],
      ]),
      at("Adelaide", [
        ["Swim with dolphins off Glenelg", "Steady", "High"],
        ["McLaren Vale wineries", "Relaxed", "Mid"],
      ]),
      at("Uluru", [
        ["Camel ride at sunrise", "Relaxed", "Mid"],
        ["Ranger-led Mala walk", "Steady", "Free"],
        ["Helicopter over Kata Tjuta", "Relaxed", "High"],
      ]),
    ],
    otherStops: [
      swap("Kangaroo Island", 2, "Grampians", "Sea lions, wild koalas and the Remarkable Rocks."),
      swap("Kings Canyon", 1, "Uluru", "The rim walk above sheer red walls, a drive from the rock."),
    ],
  },
};
