import type { PresetDetail } from "../../preset-detail-types";

export const NEW_ZEALAND_SOUTH_ISLAND: PresetDetail = {
  stops: [
    {
      place: "Christchurch",
      summary: "Land, collect the campervans and shop for the road.",
      days: [
        {
          title: "Land and collect the vans",
          items: [
            { time: "13:00", text: "Collect the campervans" },
            { time: "15:00", text: "Supermarket stop for the first week" },
            { time: "17:30", text: "Walk in the Botanic Gardens" },
          ],
        },
      ],
    },
    {
      place: "Franz Josef",
      summary: "A glacier valley, a mirror lake and the wet west coast.",
      days: [
        {
          title: "Over Arthur's Pass",
          items: [
            { time: "07:30", text: "Leave Christchurch for the west coast" },
            { time: "10:00", text: "Arthur's Pass village, a short walk" },
            { time: "13:00", text: "Lunch in Hokitika" },
            { time: "17:30", text: "Arrive at the campsite in Franz Josef" },
          ],
        },
        {
          title: "Glacier valley",
          highlight: "Franz Josef and the west coast",
          items: [
            { time: "09:00", text: "Franz Josef glacier valley walk" },
            { time: "13:00", text: "Lunch in the village" },
            { time: "17:00", text: "Glacier hot pools" },
          ],
        },
        {
          title: "Lake Matheson",
          items: [
            { time: "07:30", text: "Lake Matheson walk, mountain reflections in the still morning" },
            { time: "11:00", text: "Fox Glacier viewpoint" },
            { time: "14:00", text: "Beach stop on the way back" },
          ],
        },
      ],
    },
    {
      place: "Wanaka",
      summary: "A lake town over the Haast Pass, with easy walks.",
      days: [
        {
          title: "Haast Pass to Wanaka",
          items: [
            { time: "08:30", text: "Drive over the Haast Pass" },
            { time: "10:30", text: "Thunder Creek Falls" },
            { time: "16:00", text: "The Wanaka tree on the lake shore" },
          ],
        },
        {
          title: "Diamond Lake",
          items: [
            { time: "08:30", text: "Diamond Lake and Rocky Mountain walk" },
            { time: "13:00", text: "Lunch in town" },
            { time: "16:00", text: "Swim in Lake Wanaka" },
          ],
        },
      ],
    },
    {
      place: "Queenstown",
      summary: "Four nights on the lake: Arrowtown, Glenorchy and a rest day.",
      days: [
        {
          title: "Crown Range to Queenstown",
          items: [
            { time: "09:30", text: "Drive over the Crown Range" },
            { time: "11:00", text: "Arrowtown and the river walk" },
            { time: "19:00", text: "Dinner in Queenstown" },
          ],
        },
        {
          title: "Hill walk, then nothing",
          items: [
            { time: "09:00", text: "Queenstown Hill walk" },
            { time: "12:00", text: "Lunch on the waterfront" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Glenorchy",
          items: [
            { time: "09:00", text: "Drive the lake road to Glenorchy" },
            { time: "11:00", text: "Short walk at the head of the lake" },
            { time: "13:00", text: "Picnic by the water" },
          ],
        },
        {
          title: "Gondola and steamship",
          items: [
            { time: "10:00", text: "Skyline gondola above the town" },
            { time: "15:00", text: "Lake cruise on the steamship" },
            { time: "17:30", text: "Stock up for the early start" },
          ],
        },
      ],
    },
    {
      place: "Te Anau",
      summary: "The road to Milford Sound, then a quiet lakeside day.",
      days: [
        {
          title: "Milford Sound",
          highlight: "Milford Sound before the coaches",
          items: [
            { time: "05:30", text: "Leave Queenstown, about four hours to Milford" },
            { time: "10:00", text: "Cruise on the sound" },
            { time: "15:00", text: "Drive to Te Anau, about two hours" },
          ],
        },
        {
          title: "Lake Te Anau",
          items: [
            { time: "09:00", text: "Kepler track walk to Brod Bay" },
            { time: "13:00", text: "Lunch in town" },
            { time: "16:00", text: "Glowworm caves by boat" },
          ],
        },
      ],
    },
    {
      place: "Aoraki / Mount Cook",
      summary: "A long drive north to the highest peak and a dark sky.",
      days: [
        {
          title: "The long drive north",
          items: [
            { time: "07:30", text: "Leave Te Anau, about six hours of driving" },
            { time: "12:00", text: "Lunch in Omarama" },
            { time: "15:00", text: "Lake Pukaki viewpoint" },
          ],
        },
        {
          title: "Hooker Valley and the stars",
          highlight: "Aoraki / Mount Cook stargazing",
          items: [
            { time: "08:30", text: "Hooker Valley track, about three hours return" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
            { time: "22:00", text: "Stargazing under the dark sky" },
          ],
        },
        {
          title: "Home from Christchurch",
          items: [
            { time: "08:00", text: "Drive back to Christchurch" },
            { time: "10:30", text: "Coffee at Lake Tekapo" },
            { time: "14:00", text: "Hand back the campervans" },
            { time: "17:00", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "14", label: "nights, all planned" },
    { value: "5", label: "drives" },
    { value: "45", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book campsites for Franz Josef, Queenstown and Aoraki ahead. They fill up."],
    },
    {
      topic: "transport",
      title: "Driving a campervan",
      lines: ["Drive on the left. Allow more time than the map says.", "Fuel up before the long stretches. Stations are far apart."],
    },
    {
      topic: "weather",
      title: "Weather",
      lines: ["November to March is the warmest stretch. It can still turn cold fast.", "Check the Milford road status before you leave."],
    },
    {
      topic: "customs",
      title: "Camping rules",
      lines: ["Sleep only in a campsite that allows campervans.", "Take all rubbish with you."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Full. Six stops in fourteen nights." },
    { label: "Driving", text: "Several days of five to six hours. Share the wheel." },
  ],
};
