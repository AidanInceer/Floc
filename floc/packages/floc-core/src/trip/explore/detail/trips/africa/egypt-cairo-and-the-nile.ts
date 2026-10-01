import type { PresetDetail } from "../../preset-detail-types";

export const EGYPT_CAIRO_AND_THE_NILE: PresetDetail = {
  stops: [
    {
      place: "Cairo",
      summary: "The bazaar, then the pyramids at opening time.",
      days: [
        {
          title: "Land and the bazaar",
          items: [
            { time: "10:00", text: "Land in Cairo, transfer to the hotel" },
            { time: "13:30", text: "Khan el-Khalili bazaar and lunch" },
            { time: "17:00", text: "Sunset in Al-Azhar park" },
          ],
        },
        {
          title: "Pyramids at opening",
          highlight: "Giza before the crowds",
          items: [
            { time: "08:00", text: "Pyramids of Giza as the gates open" },
            { time: "11:30", text: "Step pyramid at Saqqara" },
            { time: "15:30", text: "Early dinner, bags out for the morning flight" },
          ],
        },
      ],
    },
    {
      place: "Nile cruise from Luxor",
      summary: "Four nights on a boat, a temple most mornings and a sun deck in between.",
      days: [
        {
          title: "Fly to Luxor",
          items: [
            { time: "08:00", text: "Flight from Cairo to Luxor, about 1 hour" },
            { time: "12:00", text: "Board the boat and have lunch" },
            { time: "15:30", text: "Karnak temple" },
            { time: "19:00", text: "Luxor temple, lit at night" },
          ],
        },
        {
          title: "Valley of the Kings",
          highlight: "Valley of the Kings",
          items: [
            { time: "06:30", text: "Valley of the Kings, before the heat" },
            { time: "09:30", text: "Hatshepsut's temple at Deir el-Bahari" },
            { time: "12:30", text: "Sail south from Luxor" },
            { time: "14:30", text: "Empty on purpose. Sun deck, no stops.", free: true },
          ],
        },
        {
          title: "Edfu and Kom Ombo",
          items: [
            { time: "07:30", text: "Edfu temple by horse carriage" },
            { time: "11:00", text: "Sail on to Kom Ombo" },
            { time: "16:30", text: "Kom Ombo temple at dusk" },
          ],
        },
        {
          title: "Sail to Aswan",
          items: [
            { time: "09:00", text: "Sail through the Nile valley to Aswan" },
            { time: "13:00", text: "Dock in Aswan, lunch on board" },
            { time: "19:00", text: "Last dinner on the boat" },
          ],
        },
      ],
    },
    {
      place: "Aswan",
      summary: "An island temple, a sail at dusk and the early trip to Abu Simbel.",
      days: [
        {
          title: "Philae and the felucca",
          highlight: "Felucca at dusk in Aswan",
          items: [
            { time: "08:00", text: "Leave the boat, bags to the hotel" },
            { time: "10:00", text: "Philae temple by motorboat" },
            { time: "13:00", text: "Lunch by the river" },
            { time: "17:00", text: "Felucca around Elephantine island at dusk" },
          ],
        },
        {
          title: "Abu Simbel, then nothing",
          items: [
            { time: "04:00", text: "Leave in the convoy for Abu Simbel, about 3 hours" },
            { time: "07:00", text: "The temples of Abu Simbel" },
            { time: "12:30", text: "Back in Aswan" },
            { time: "15:00", text: "Empty on purpose. Sleep.", free: true },
          ],
        },
        {
          title: "Home from Aswan",
          items: [
            { time: "09:00", text: "Transfer to Aswan airport" },
            { time: "12:00", text: "Flight to Cairo, then home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "8", label: "nights, all planned" },
    { value: "2", label: "rides, one flight and one boat" },
    { value: "28", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book the boat early for October to April."],
    },
    {
      topic: "money",
      title: "Small notes",
      lines: ["Carry small notes for tips. Staff, guides and drivers expect them.", "Agree a price before a ride, a felucca or a bazaar buy."],
    },
    {
      topic: "customs",
      title: "Dress",
      lines: ["Cover shoulders and knees at mosques and in the old districts.", "A light scarf helps. Take shoes off at mosque doors."],
    },
    {
      topic: "health",
      title: "Water and sun",
      lines: ["Drink bottled water and avoid ice you cannot vouch for.", "Hat, sunscreen and a stomach remedy go in the bag."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Full. A temple most mornings, then a 04:00 start for Abu Simbel." },
    { label: "Heat", text: "Midday is hot even in winter. The big sites are early for that reason." },
    { label: "Walking", text: "A lot, on uneven stone." },
  ],
};
