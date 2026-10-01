import type { PresetDetail } from "../../preset-detail-types";

export const CANADA_ROCKIES_LAKES: PresetDetail = {
  stops: [
    {
      place: "Banff",
      summary: "Lakes, a gondola and canyon walks from one town.",
      days: [
        {
          title: "Land in Calgary, drive to Banff",
          items: [
            { time: "14:00", text: "Drive from Calgary airport to Banff, about 1h 30" },
            { time: "17:00", text: "Walk to Bow Falls" },
            { time: "19:30", text: "Dinner on Banff Avenue" },
          ],
        },
        {
          title: "Lake Louise by canoe",
          highlight: "Lake Louise canoe",
          items: [
            { time: "08:00", text: "Drive to Lake Louise, about 45 minutes. Parking fills early." },
            { time: "09:30", text: "Canoe on Lake Louise" },
            { time: "13:00", text: "Lakeshore walk and lunch" },
          ],
        },
        {
          title: "Gondola, then nothing",
          items: [
            { time: "09:00", text: "Banff Gondola up Sulphur Mountain" },
            { time: "12:30", text: "Lake Minnewanka shore" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Johnston Canyon",
          items: [
            { time: "08:30", text: "Johnston Canyon walk to the falls" },
            { time: "12:30", text: "Lunch back in Banff" },
            { time: "15:00", text: "Slow drive on the Bow Valley Parkway" },
          ],
        },
      ],
    },
    {
      place: "Jasper",
      summary: "The Icefields Parkway first, then canyons and quiet lakes.",
      days: [
        {
          title: "The Icefields Parkway",
          highlight: "Icefields Parkway",
          items: [
            { time: "08:30", text: "Leave Banff, 3 hours of driving without stops" },
            { time: "10:00", text: "Peyto Lake viewpoint" },
            { time: "13:00", text: "Columbia Icefield and the Athabasca Glacier" },
            { time: "16:00", text: "Athabasca Falls, then on to Jasper" },
          ],
        },
        {
          title: "Maligne Canyon",
          highlight: "Maligne Canyon walk",
          items: [
            { time: "09:00", text: "Maligne Canyon, from the first bridge to the fourth" },
            { time: "12:00", text: "Picnic at Medicine Lake" },
            { time: "16:00", text: "Walk around Jasper town" },
          ],
        },
        {
          title: "Pyramid Lake, then nothing",
          items: [
            { time: "09:00", text: "Pyramid Lake and its island" },
            { time: "12:30", text: "Lunch in Jasper" },
            { time: "14:30", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Home from Edmonton",
          items: [
            { time: "07:00", text: "Drive to Edmonton airport, about 4 hours" },
            { time: "14:30", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "7", label: "nights, all planned" },
    { value: "1", label: "drive between stops" },
    { value: "22", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Buy a Parks Canada pass for the car. The parks need one."],
    },
    {
      topic: "transport",
      title: "The Parkway",
      lines: ["Fuel stops are few on the Icefields Parkway. Fill up before you leave Banff.", "Fly into Calgary and out of Edmonton to avoid a long drive back."],
    },
    {
      topic: "customs",
      title: "Bears and wildlife",
      lines: ["Carry bear spray on trails and know how to use it.", "Stay in the car near elk and bears, and never feed them."],
    },
    {
      topic: "weather",
      title: "Mountain weather",
      lines: ["It can turn cold or wet in a day, even in summer.", "Pack layers and a waterproof jacket."],
    },
  ],
  goodToKnow: [
    { label: "Driving", text: "Easy roads, long distances. Banff to Jasper is one full day." },
    { label: "Walking", text: "Short walks, most on boardwalk or gravel." },
    { label: "Pace", text: "Relaxed. Two stops, with one long drive between them." },
  ],
};
