import type { PresetDetail } from "../../preset-detail-types";

export const FIJI_YASAWA_ISLANDS: PresetDetail = {
  stops: [
    {
      place: "Nadi",
      summary: "One night on the main island to land and sort the island bags.",
      days: [
        {
          title: "Land and pack light",
          items: [
            { time: "15:00", text: "Airport to the hotel" },
            { time: "17:00", text: "Pack the island bag, leave the rest here" },
            { time: "19:00", text: "Dinner at the hotel" },
          ],
        },
      ],
    },
    {
      place: "Yasawa islands",
      summary: "Snorkelling, village life, manta rays and a lot of time on the beach.",
      days: [
        {
          title: "The boat north",
          items: [
            { time: "09:15", text: "Ferry from Denarau marina, about 3 hours" },
            { time: "12:30", text: "Small boat to the lodge and lunch" },
            { time: "14:00", text: "First swim off the beach" },
            { time: "18:00", text: "Dinner with the other guests" },
          ],
        },
        {
          title: "A village visit",
          highlight: "Village visit",
          items: [
            { time: "09:30", text: "Visit the village with a guide from the lodge" },
            { time: "12:30", text: "Lunch at the lodge" },
            { time: "14:30", text: "Empty on purpose. Hammocks.", free: true },
          ],
        },
        {
          title: "Kayaks and kava",
          highlight: "Sunset kava",
          items: [
            { time: "09:00", text: "Kayak along the coast" },
            { time: "12:30", text: "Lunch at the lodge" },
            { time: "17:30", text: "Kava at sunset" },
          ],
        },
        {
          title: "Manta rays",
          highlight: "Swim with manta rays",
          items: [
            { time: "07:30", text: "Boat to the manta channel. Rays are wild and not certain." },
            { time: "08:30", text: "Snorkel with the rays if they are in" },
            { time: "12:30", text: "Back for lunch" },
          ],
        },
        {
          title: "A hill walk, then nothing",
          items: [
            { time: "09:30", text: "Walk up to the island viewpoint" },
            { time: "12:30", text: "Lunch at the lodge" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Last full day",
          items: [
            { time: "09:00", text: "Snorkel the reef off the beach" },
            { time: "13:00", text: "Lunch, then a long afternoon on the sand" },
            { time: "18:30", text: "Farewell dinner. Ask the lodge about a lovo." },
          ],
        },
        {
          title: "Home from Nadi",
          items: [
            { time: "09:00", text: "Ferry back to Denarau marina, about 3 hours" },
            { time: "12:30", text: "Transfer to Nadi airport" },
            { time: "16:00", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "7", label: "nights, all planned" },
    { value: "1", label: "boat ride" },
    { value: "23", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book the ferry and the lodge early. Both run to a set timetable."],
    },
    {
      topic: "customs",
      title: "Village manners",
      lines: ["Cover your shoulders and knees in the village, and take off your hat.", "The lodge will explain the kava gift before you go."],
    },
    {
      topic: "money",
      title: "Cash on the islands",
      lines: ["Bring Fijian dollars in cash. Lodges and boats often take no cards.", "There are no cash machines on the islands."],
    },
    {
      topic: "health",
      title: "Sun and water",
      lines: ["Bring reef-safe sunscreen and a rash vest.", "Bring any medicine you need. The nearest clinic is a boat ride away."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Very slow. One night on the mainland, then six on the same island." },
    { label: "Connection", text: "Phone signal and wifi are patchy or missing at the lodges." },
  ],
};
