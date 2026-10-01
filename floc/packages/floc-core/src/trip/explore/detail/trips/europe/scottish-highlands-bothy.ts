import type { PresetDetail } from "../../preset-detail-types";

export const SCOTTISH_HIGHLANDS_BOTHY: PresetDetail = {
  stops: [
    {
      place: "Torridon",
      summary: "One cottage, three walking days from easy to hard, and two days out by car.",
      days: [
        {
          title: "Drive in from Inverness",
          items: [
            { time: "13:00", text: "Collect the hire car in Inverness" },
            { time: "14:30", text: "Drive to Torridon, about two hours" },
            { time: "17:30", text: "Short walk on the shore of Loch Torridon" },
          ],
        },
        {
          title: "An easy walk first",
          items: [
            { time: "09:30", text: "Lochside and woodland walk, flat and short" },
            { time: "12:30", text: "Picnic by the water" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Beinn Eighe, the hard day",
          highlight: "Beinn Eighe from the Coire Dubh path",
          items: [
            { time: "08:30", text: "Start from the Coire Dubh car park" },
            { time: "12:30", text: "Lunch where the path opens out" },
            { time: "16:30", text: "Back at the car. Anyone can turn round early." },
          ],
        },
        {
          title: "Applecross by the Bealach na Bà",
          highlight: "Applecross by the Bealach na Bà",
          items: [
            { time: "09:30", text: "Drive over the Bealach na Bà, steep and single track" },
            { time: "12:00", text: "Lunch in Applecross" },
            { time: "15:00", text: "Shore walk, then back round the coast" },
          ],
        },
        {
          title: "A rest day in Plockton",
          highlight: "A rest day in Plockton",
          items: [
            { time: "10:30", text: "Drive to Plockton, about 1h 15" },
            { time: "12:00", text: "Harbour front and lunch" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Back to Inverness",
          items: [
            { time: "09:00", text: "Drive to Inverness, about two hours" },
            { time: "14:00", text: "Train or flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "5", label: "nights, all planned" },
    { value: "2", label: "day drives" },
    { value: "15", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "transport",
      title: "Single-track roads",
      lines: ["Pull into a passing place to let others by.", "The Bealach na Bà is steep and narrow. Skip it in cloud or ice."],
    },
    {
      topic: "weather",
      title: "Weather and midges",
      lines: ["Pack waterproofs even in June. The weather turns fast.", "Midges bite in still air from late May. Bring repellent."],
    },
    {
      topic: "health",
      title: "On the hill",
      lines: ["Phone signal is poor. Tell someone your route and your return time.", "Carry a paper map and a torch."],
    },
    {
      topic: "customs",
      title: "Land and animals",
      lines: ["Leave gates as you find them.", "Keep dogs on a lead near sheep."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Easy. One base, one hard day." },
    { label: "Walking", text: "Three walking days, from easy to hard. The long one is Beinn Eighe." },
    { label: "Driving", text: "Single-track roads and a steep pass. Allow extra time." },
  ],
};
