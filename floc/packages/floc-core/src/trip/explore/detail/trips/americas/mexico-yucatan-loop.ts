import type { PresetDetail } from "../../preset-detail-types";

export const MEXICO_YUCATAN_LOOP: PresetDetail = {
  stops: [
    {
      place: "Tulum",
      summary: "The cliff-top ruins, cenotes and a slow beach day.",
      days: [
        {
          title: "Land, then the beach",
          items: [
            { time: "14:00", text: "Drive from Cancun airport to Tulum, about 1h 45" },
            { time: "17:00", text: "Beach at sunset" },
            { time: "19:30", text: "Dinner in town" },
          ],
        },
        {
          title: "Ruins and a cenote",
          highlight: "Swimming in cenotes",
          items: [
            { time: "08:30", text: "Tulum ruins on the cliff, before the heat" },
            { time: "11:30", text: "Swim in a cenote near Tulum" },
            { time: "17:00", text: "Cold drinks on the beach" },
          ],
        },
        {
          title: "Turtles, then nothing",
          items: [
            { time: "09:00", text: "Snorkel with turtles at Akumal" },
            { time: "12:30", text: "Lunch by the bay" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
      ],
    },
    {
      place: "Valladolid",
      summary: "A colonial town, and Chichen Itza at opening time.",
      days: [
        {
          title: "Drive to Valladolid",
          items: [
            { time: "09:00", text: "Drive from Tulum, about 2 hours" },
            { time: "11:30", text: "Swim in Cenote Zaci in town" },
            { time: "15:00", text: "Convent of San Bernardino de Siena" },
            { time: "19:00", text: "Dinner on the main square" },
          ],
        },
        {
          title: "Chichen Itza at opening",
          highlight: "Chichén Itzá at opening",
          items: [
            { time: "08:00", text: "Chichen Itza when the gates open, about 45 minutes' drive" },
            { time: "11:30", text: "Swim at Ik Kil cenote on the way back" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
      ],
    },
    {
      place: "Mérida",
      summary: "Markets, museums and the food of the Yucatan.",
      days: [
        {
          title: "Drive to Mérida",
          items: [
            { time: "09:30", text: "Drive from Valladolid, about 2h 30" },
            { time: "12:00", text: "Izamal, the yellow town, and its convent" },
            { time: "16:30", text: "Walk the main square and the cathedral" },
            { time: "20:00", text: "Dinner in the old centre" },
          ],
        },
        {
          title: "Markets and Maya history",
          items: [
            { time: "09:00", text: "Lucas de Galvez market" },
            { time: "11:00", text: "Gran Museo del Mundo Maya" },
            { time: "19:00", text: "Yucatecan dishes in the Santa Lucia quarter" },
          ],
        },
        {
          title: "Sunday in the centre",
          highlight: "Mérida's Sunday market",
          items: [
            { time: "09:00", text: "Sunday market in the centre" },
            { time: "12:00", text: "Paseo de Montejo, closed to cars on Sundays" },
            { time: "19:00", text: "Last dinner together" },
          ],
        },
        {
          title: "Home from Mérida",
          items: [
            { time: "08:30", text: "Drive to Mérida airport and return the car" },
            { time: "11:30", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "8", label: "nights, all planned" },
    { value: "2", label: "drives" },
    { value: "26", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book the hire car early and ask what the insurance covers."],
    },
    {
      topic: "money",
      title: "Money",
      lines: ["Carry pesos in small notes. Cenotes, ruins and roadside stalls often take cash only.", "Check the bill before you pay."],
    },
    {
      topic: "transport",
      title: "Driving",
      lines: ["Fill up at the big stations on the main road.", "Watch for speed bumps in every village, and do not drive after dark."],
    },
    {
      topic: "health",
      title: "Sun and water",
      lines: ["Cenotes ask for biodegradable sunscreen. Rinse off before you swim.", "Drink bottled water and carry a hat."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Easy. Three bases and short drives." },
    { label: "Driving", text: "Two to two and a half hours a leg. Share the wheel." },
    { label: "Dates", text: "Plan so the last full day is a Sunday for Mérida's market." },
  ],
};
