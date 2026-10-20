import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const MOROCCO_ATLAS_SAHARA: PresetDetail = {
  stops: [
    {
      place: "Marrakech",
      summary: "The square, the souks and a garden for the heat of the day.",
      days: [
        day("Into the medina", ["14:00 Airport to the riad", "17:00 Jemaa el-Fna as the stalls go up", "20:00 Dinner on a roof terrace"]),
        day("Souks and gardens", ["09:00 The souks with a guide", "13:00 Lunch in the medina", "16:00 Jardin Majorelle", "19:00 ~ Free evening."]),
      ],
    },
    {
      place: "Imlil",
      summary: "Two nights in a Berber village under Toubkal.",
      days: [
        day("Up into the High Atlas", ["09:00 Drive to Imlil by Asni, about 2 hours", "12:30 Lunch in the village", "15:00 Easy walk to Aroumd and back"]),
        day("The valley on foot", ["08:30 * Set off with the local guide", "12:30 Picnic lunch above the river", "16:00 Back in Imlil for mint tea"], "Imlil valley trek with a local guide"),
      ],
    },
    {
      place: "Aït Benhaddou",
      summary: "Over the Tizi n'Tichka pass to the old mud-brick ksar.",
      days: [day("Over the pass", ["08:30 The Tizi n'Tichka road", "13:00 Telouet kasbah", "17:00 Walk up through Aït Benhaddou"])],
    },
    {
      place: "Dades gorge",
      summary: "The road of a thousand kasbahs and the gorge at dusk.",
      days: [day("Kasbah road", ["09:00 Ouarzazate film studios", "12:00 Skoura palm grove", "16:30 The gorge's switchbacks at dusk"])],
    },
    {
      place: "Erg Chebbi",
      summary: "Camels at sunset and a night under canvas in the dunes.",
      days: [day("Into the dunes", ["09:00 Todra gorge on foot", "13:00 Drive on to Merzouga", "17:00 * Camels into the dunes", "20:00 Dinner and drums at the camp"], "A night under canvas in the dunes")],
    },
    {
      place: "Fes",
      summary: "The long drive north, then the oldest medina in the world.",
      days: [
        day("North to Fes", ["06:00 Sunrise from the dune", "08:00 Drive north through the Middle Atlas, about 8h", "18:00 Arrive in Fes"]),
        day("The medina", ["09:00 * Fes el-Bali with a guide", "12:00 The tanneries from a terrace", "15:00 ~ Free afternoon.", "19:30 Dinner in a palace riad"], "Lost in the Fes medina"),
        day("Fes, slow", ["10:00 Hammam", "13:00 Lunch at the Batha", "16:00 The Merenid tombs at sunset"]),
        day("Home from Fes", ["09:00 Airport", "11:00 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "10", label: "nights, all planned" },
    { value: "6", label: "stops" },
    { value: "1", label: "night in the desert" },
    { value: "1", label: "guided trek" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Check the entry rules for your passport.", "Bring a warm layer. Desert nights are cold."] },
    { topic: "money", title: "Money", lines: ["Carry dirhams. The mountains and the camp take cash only.", "Haggle in the souks, kindly."] },
    { topic: "customs", title: "Customs", lines: ["Cover shoulders and knees in villages.", "Ask before you take a photo of someone."] },
    { topic: "transport", title: "Drives", lines: ["A driver for the whole loop. The Fes day is the long one."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "On the move after Imlil. Four one-night stops in a row." },
    { label: "Walking", text: "One full day on foot in the valley. Paths are rocky." },
  ],
};
