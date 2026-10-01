import type { PresetDetail } from "../../preset-detail-types";

export const ICELAND_RING_ROAD: PresetDetail = {
  stops: [
    {
      place: "Reykjavík",
      summary: "Land, collect the car and see the city before the road.",
      days: [
        {
          title: "Land and the old harbour",
          items: [
            { time: "08:00", text: "Land at Keflavík and collect the car" },
            { time: "10:30", text: "Hallgrímskirkja tower and the old harbour" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
            { time: "19:00", text: "Dinner in the city centre" },
          ],
        },
      ],
    },
    {
      place: "Vík",
      summary: "Waterfalls and black sand along the south coast.",
      days: [
        {
          title: "Waterfalls and black sand",
          items: [
            { time: "08:30", text: "Drive east along the south coast" },
            { time: "10:30", text: "Seljalandsfoss, walk behind the fall" },
            { time: "12:00", text: "Skógafoss" },
            { time: "15:00", text: "Reynisfjara black sand beach" },
          ],
        },
      ],
    },
    {
      place: "Höfn",
      summary: "Ice, a glacier lagoon and a quiet day by the mountains.",
      days: [
        {
          title: "Glacier lagoon",
          highlight: "Jökulsárlón glacier lagoon",
          items: [
            { time: "08:30", text: "Drive east across the lava fields" },
            { time: "11:00", text: "Svartifoss walk at Skaftafell" },
            { time: "14:00", text: "Jökulsárlón glacier lagoon" },
            { time: "16:30", text: "Diamond beach, then on to Höfn" },
          ],
        },
        {
          title: "Vestrahorn, then nothing",
          items: [
            { time: "09:00", text: "Stokksnes beach under Vestrahorn" },
            { time: "12:30", text: "Seafood lunch in Höfn" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
      ],
    },
    {
      place: "Mývatn",
      summary: "Steam fields, hot water and the Diamond Circle.",
      days: [
        {
          title: "East fjords, then steam",
          items: [
            { time: "08:00", text: "Long drive through the east fjords, about 5h 30" },
            { time: "12:30", text: "Lunch in Egilsstaðir" },
            { time: "16:00", text: "Hverir steam fields" },
            { time: "20:00", text: "Mývatn Nature Baths in the evening light" },
          ],
        },
        {
          title: "The Diamond Circle",
          highlight: "Mývatn and the Diamond Circle",
          items: [
            { time: "09:00", text: "Dettifoss" },
            { time: "11:30", text: "Ásbyrgi canyon" },
            { time: "14:00", text: "Húsavík harbour" },
            { time: "17:00", text: "Goðafoss on the way back" },
          ],
        },
      ],
    },
    {
      place: "Snæfellsnes",
      summary: "A long drive west, then the peninsula and the road to the airport.",
      days: [
        {
          title: "West along the north coast",
          items: [
            { time: "08:30", text: "Drive west by Akureyri, about 6h with stops" },
            { time: "12:00", text: "Lunch in Akureyri" },
            { time: "18:30", text: "Kirkjufell in the evening light" },
          ],
        },
        {
          title: "The peninsula, then home",
          highlight: "Snæfellsnes on the way back",
          items: [
            { time: "09:00", text: "Coast walk from Arnarstapi to Hellnar" },
            { time: "11:30", text: "Djúpalónssandur beach" },
            { time: "14:30", text: "Drive to Keflavík airport, about 3h" },
            { time: "20:00", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "7", label: "nights, all planned" },
    { value: "4", label: "drives" },
    { value: "28", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Read safetravel.is before you set off."],
    },
    {
      topic: "money",
      title: "Money",
      lines: ["Cards work almost everywhere, even for a coffee.", "Fuel pumps in the north may need a card with a PIN."],
    },
    {
      topic: "transport",
      title: "The road",
      lines: ["Check road.is each morning for closures.", "Fill up when you can. Petrol stations are far apart in the east."],
    },
    {
      topic: "weather",
      title: "Wind and waves",
      lines: ["Hold the car door with both hands. Wind can bend it.", "Stay well back from the surf at Reynisfjara."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Fast. A new base on most nights." },
    { label: "Driving", text: "Long days at the wheel, up to 5h 30. Share the driving." },
    { label: "Daylight", text: "Light until late in summer, so late stops are easy." },
  ],
};
