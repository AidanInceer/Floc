import type { PresetDetail } from "../../preset-detail-types";

export const AMALFI_SLOW_WEEK: PresetDetail = {
  stops: [
    {
      place: "Praiano",
      summary: "One base on the cliff, with ferries out to the other towns and plenty of empty time.",
      days: [
        {
          title: "Arrive and swim",
          items: [
            { time: "13:00", text: "Transfer from Naples airport, about two hours" },
            { time: "16:30", text: "Swim at Marina di Praia" },
            { time: "20:00", text: "Dinner in Praiano, no plans after" },
          ],
        },
        {
          title: "A slow first morning",
          items: [
            { time: "09:30", text: "Coffee and the village steps" },
            { time: "11:30", text: "Boat or kayak from the small beach" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Ferry to Positano and Amalfi",
          highlight: "Ferry hop to Positano and Amalfi",
          items: [
            { time: "10:00", text: "Ferry from Praiano to Positano" },
            { time: "13:00", text: "Ferry on to Amalfi, lunch by the harbour" },
            { time: "15:30", text: "Amalfi cathedral and the lanes behind it" },
            { time: "18:00", text: "Ferry back to Praiano" },
          ],
        },
        {
          title: "Path of the Gods, downhill",
          highlight: "Path of the Gods, walked downhill",
          items: [
            { time: "08:30", text: "Bus up to Bomerano" },
            { time: "09:30", text: "Walk the Path of the Gods towards Nocelle" },
            { time: "13:00", text: "Lunch in Nocelle" },
            { time: "15:00", text: "Steps down to Positano, ferry home" },
          ],
        },
        {
          title: "Early start for Pompeii",
          items: [
            { time: "07:00", text: "Leave for Pompeii, about two hours each way" },
            { time: "09:30", text: "The ruins before the heat" },
            { time: "14:30", text: "Back to Praiano" },
          ],
        },
        {
          title: "Capri",
          highlight: "A day on Capri without the day-trip crowd",
          items: [
            { time: "09:00", text: "Ferry to Capri" },
            { time: "11:00", text: "Anacapri and the chairlift up Monte Solaro" },
            { time: "14:00", text: "Lunch in Anacapri, away from the harbour" },
            { time: "17:30", text: "Ferry back" },
          ],
        },
        {
          title: "Rest day",
          items: [
            { time: "10:00", text: "Breakfast on the terrace" },
            { time: "12:00", text: "Beach and a long lunch" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Home from Naples",
          items: [
            { time: "09:00", text: "Transfer to Naples airport" },
            { time: "14:00", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "7", label: "nights, all planned" },
    { value: "2", label: "boat days" },
    { value: "24", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Pompeii sells timed tickets. Book them before you fly."],
    },
    {
      topic: "money",
      title: "Money",
      lines: ["Many restaurants add a small cover charge per person. It is normal.", "Keep some cash for buses and small cafes."],
    },
    {
      topic: "transport",
      title: "Ferries and buses",
      lines: ["Ferries run in season only. Check the timetable the day before.", "The coast road is slow in summer. Use boats where you can."],
    },
    {
      topic: "health",
      title: "Walking shoes",
      lines: ["The Path of the Gods ends in steps. Wear shoes with grip.", "Carry water. There is little shade."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Slow. One base and one early start." },
    { label: "Steps", text: "Praiano is steep. Every beach has many steps." },
    { label: "Walking", text: "The Path of the Gods takes about three hours." },
  ],
};
