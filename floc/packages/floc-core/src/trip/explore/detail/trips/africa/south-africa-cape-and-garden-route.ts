import type { PresetDetail } from "../../preset-detail-types";

export const SOUTH_AFRICA_CAPE_AND_GARDEN_ROUTE: PresetDetail = {
  stops: [
    {
      place: "Cape Town",
      summary: "The mountain, the winelands and the peninsula, with one afternoon free.",
      days: [
        {
          title: "Land and Bo-Kaap",
          items: [
            { time: "11:00", text: "Land at Cape Town airport, transfer to the hotel" },
            { time: "14:00", text: "Walk the coloured houses of Bo-Kaap" },
            { time: "18:30", text: "Sunset on the beach at Camps Bay" },
          ],
        },
        {
          title: "Gardens, then the mountain",
          highlight: "Table Mountain at sunset",
          items: [
            { time: "09:00", text: "Kirstenbosch botanical garden" },
            { time: "13:00", text: "Lunch at the V&A Waterfront" },
            { time: "17:30", text: "Cable car up Table Mountain for sunset" },
          ],
        },
        {
          title: "Winelands day",
          highlight: "Winelands day",
          items: [
            { time: "09:30", text: "Drive to Stellenbosch, about 45 minutes" },
            { time: "11:00", text: "Tasting at a wine estate, with a driver" },
            { time: "13:30", text: "Long lunch in Franschhoek" },
          ],
        },
        {
          title: "Cape Point, then nothing",
          items: [
            { time: "08:30", text: "Chapman's Peak drive to Cape Point" },
            { time: "12:00", text: "Penguins at Boulders Beach" },
            { time: "13:30", text: "Lunch in Simon's Town" },
            { time: "15:30", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
      ],
    },
    {
      place: "Hermanus",
      summary: "One night on the cliffs, watching for whales.",
      days: [
        {
          title: "Coast road to the whales",
          highlight: "Whale watching from the cliffs",
          items: [
            { time: "09:00", text: "Drive to Hermanus on Clarence Drive, about 1h 30" },
            { time: "11:30", text: "Walk the cliff path above the bay" },
            { time: "14:00", text: "Whale watching from the cliffs" },
            { time: "18:30", text: "Dinner in the old harbour area" },
          ],
        },
      ],
    },
    {
      place: "Knysna",
      summary: "A lagoon town, a forest coast and a slow last few days.",
      days: [
        {
          title: "The long drive east",
          items: [
            { time: "08:30", text: "Drive east on the N2, about 5 hours with stops" },
            { time: "11:00", text: "Coffee in Swellendam" },
            { time: "14:30", text: "Arrive in Knysna and walk the waterfront" },
          ],
        },
        {
          title: "Heads and lagoon",
          items: [
            { time: "09:00", text: "Knysna Heads viewpoint" },
            { time: "11:00", text: "Boat trip on the lagoon" },
            { time: "14:00", text: "Oyster lunch by the water" },
          ],
        },
        {
          title: "Storms River, then nothing",
          items: [
            { time: "08:30", text: "Drive to Tsitsikamma, about 1h 30" },
            { time: "10:00", text: "Suspension bridge walk at Storms River Mouth" },
            { time: "13:00", text: "Lunch in Plettenberg Bay" },
            { time: "15:00", text: "Empty on purpose. Swim or sleep.", free: true },
          ],
        },
        {
          title: "Home from George",
          items: [
            { time: "08:00", text: "Drive to George airport, about 1h 15" },
            { time: "12:00", text: "Flight home, usually via Johannesburg or Cape Town" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "8", label: "nights, all planned" },
    { value: "2", label: "drives" },
    { value: "27", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Keep the Table Mountain evening flexible. The cable car closes in strong wind."],
    },
    {
      topic: "transport",
      title: "Driving",
      lines: ["Traffic drives on the left. The N2 east is a good road, but the day is long.", "Keep bags out of sight in parked cars."],
    },
    {
      topic: "money",
      title: "Tips",
      lines: ["Ten per cent is usual in restaurants.", "Car park attendants expect a small coin."],
    },
    {
      topic: "weather",
      title: "Wind and whales",
      lines: ["Cape Town is windy in summer. Pack a light layer.", "Whales are in the bay roughly June to November, so October and November are the likely months."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. Four nights in one place, then two moves by car." },
    { label: "Driving", text: "Left-hand traffic. The longest day is about five hours on the N2." },
    { label: "Whales", text: "Southern right whales visit Hermanus roughly June to November." },
  ],
};
