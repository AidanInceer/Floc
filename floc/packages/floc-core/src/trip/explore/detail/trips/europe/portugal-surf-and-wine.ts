import type { PresetDetail } from "../../preset-detail-types";

export const PORTUGAL_SURF_AND_WINE: PresetDetail = {
  stops: [
    {
      place: "Ericeira",
      summary: "Three mornings in the water, two days out to Sintra and Lisbon, and long afternoons in a surf town.",
      days: [
        {
          title: "Land, then the clifftop",
          items: [
            { time: "14:00", text: "Lisbon airport to Ericeira, about 50 minutes by road" },
            { time: "16:30", text: "Walk the old town and the clifftop" },
            { time: "19:30", text: "Dinner in the old town" },
          ],
        },
        {
          title: "First session in the water",
          highlight: "Three coached surf sessions",
          items: [
            { time: "09:00", text: "Wetsuits and a briefing on the sand" },
            { time: "10:00", text: "First coached session at Ribeira d'Ilhas" },
            { time: "13:30", text: "Lunch near the beach" },
            { time: "15:00", text: "Empty on purpose. Sleep, read or paddle again.", free: true },
          ],
        },
        {
          title: "Palaces and gardens in Sintra",
          highlight: "Sintra day trip",
          items: [
            { time: "09:00", text: "Drive to Sintra, about 30 minutes" },
            { time: "10:00", text: "Pena palace" },
            { time: "13:00", text: "Lunch in Sintra old town" },
            { time: "15:30", text: "Quinta da Regaleira and its gardens" },
          ],
        },
        {
          title: "Second session, then nothing",
          items: [
            { time: "09:00", text: "Second coached session" },
            { time: "12:30", text: "Lunch by the harbour" },
            { time: "14:30", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Last session, then Lisbon",
          highlight: "A long lunch in Time Out market",
          items: [
            { time: "08:00", text: "Third coached session" },
            { time: "12:30", text: "Drive to Lisbon, about 50 minutes" },
            { time: "13:30", text: "A long lunch in Time Out market" },
            { time: "16:00", text: "Walk through Alfama and up to a viewpoint" },
          ],
        },
        {
          title: "Home from Lisbon",
          items: [
            { time: "09:00", text: "Last coffee in Ericeira" },
            { time: "10:30", text: "Transfer to Lisbon airport" },
            { time: "14:00", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "5", label: "nights, all planned" },
    { value: "2", label: "day trips" },
    { value: "19", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Tell the surf school early if anyone is a weak swimmer."],
    },
    {
      topic: "money",
      title: "Money",
      lines: ["Portugal uses the euro. Cards work almost everywhere.", "Keep a little cash for small cafes and parking."],
    },
    {
      topic: "transport",
      title: "Sintra",
      lines: ["Go early. Car parks fill up and the road into the hills backs up.", "Book timed entry to Pena palace before you travel."],
    },
    {
      topic: "weather",
      title: "Cold Atlantic",
      lines: ["The water is cool even in summer. Wetsuits are provided for lessons.", "Mornings can be misty. Bring a layer and sun cream."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Slow. One base, two afternoons left empty." },
    { label: "Driving", text: "Sintra and Lisbon are 30 to 50 minutes from Ericeira." },
  ],
};
