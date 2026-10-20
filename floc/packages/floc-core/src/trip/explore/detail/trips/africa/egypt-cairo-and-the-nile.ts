import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const EGYPT_CAIRO_AND_THE_NILE: PresetDetail = {
  stops: [
    {
      place: "Cairo",
      summary: "The pyramids early, the museum and the old city.",
      days: [
        day("Land in Cairo", ["15:00 Airport to the hotel at Giza", "18:30 Sound and light at the pyramids", "20:30 Dinner"]),
        day("Giza before the crowds", ["07:00 * The pyramids at opening", "10:00 The Sphinx", "14:00 The Grand Egyptian Museum"], "Giza before the crowds"),
        day("Old Cairo", ["09:00 Coptic Cairo", "12:00 The citadel", "16:00 Khan el-Khalili bazaar", "19:30 Koshari for dinner"]),
      ],
    },
    {
      place: "Luxor",
      summary: "The temples of Karnak and the tombs of the Valley of the Kings.",
      days: [
        day("Fly to Luxor", ["08:00 Flight, 1h", "11:00 Board the boat", "15:00 Karnak temple", "19:00 Luxor temple lit up"]),
        day("The west bank", ["06:00 Balloon over the west bank, if you like", "08:30 * The Valley of the Kings", "12:00 Hatshepsut's temple", "16:00 ~ Free afternoon on deck."], "The Valley of the Kings"),
      ],
    },
    {
      place: "Edfu",
      summary: "On the river: Edfu's temple, then Kom Ombo and its crocodiles.",
      days: [
        day("Sailing south", ["09:00 Through the lock at Esna", "13:00 Lunch on deck", "18:00 Sunset on the river"]),
        day("Edfu and Kom Ombo", ["07:00 Edfu temple by horse cart", "12:00 Sail on", "17:00 Kom Ombo and the crocodile museum"]),
      ],
    },
    {
      place: "Aswan",
      summary: "Felucca at dusk, a Nubian village and Abu Simbel at dawn.",
      days: [
        day("Into Aswan", ["09:00 Philae temple", "13:00 Leave the boat", "17:00 Felucca at dusk"]),
        day("Abu Simbel", ["04:00 Drive to Abu Simbel, about 3h 30", "08:00 * The temples of Ramses and Nefertari", "15:00 Back in Aswan"], "Abu Simbel at dawn"),
        day("Nubian village", ["10:00 Boat to a Nubian village", "13:00 Lunch with a family", "17:00 ~ Free evening."]),
        day("Home via Cairo", ["09:00 Flight to Cairo", "14:00 Connect home"]),
      ],
    },
  ],
  inPlan: [
    { value: "10", label: "nights, all planned" },
    { value: "4", label: "nights on the river" },
    { value: "7", label: "temples and tombs" },
    { value: "1", label: "flight" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Most passports need a visa. Buy the e-visa before you fly.", "Book Abu Simbel's early convoy with the boat."] },
    { topic: "money", title: "Money", lines: ["Carry small notes for tips. Tipping is expected almost everywhere.", "Cards work in hotels and big shops."] },
    { topic: "customs", title: "Customs", lines: ["Cover shoulders and knees at mosques and in the old city.", "Ask before you photograph people."] },
    { topic: "health", title: "Heat and water", lines: ["Drink bottled water and wear a hat at the sites.", "Midday is hot even in winter."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "Full. A temple most mornings, then a 04:00 start for Abu Simbel." },
    { label: "Heat", text: "Midday is hot even in winter. The big sites are early for that reason." },
    { label: "Walking", text: "A lot, on uneven stone." },
  ],
};
