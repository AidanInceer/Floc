import type { PresetDetail } from "../../preset-detail-types";

export const MOROCCO_ATLAS_SAHARA: PresetDetail = {
  stops: [
    {
      place: "Marrakech",
      summary: "The square, the souks, the gardens and one empty afternoon.",
      days: [
        {
          title: "Land, then Jemaa el-Fnaa",
          items: [
            { time: "15:00", text: "Airport to the riad in the medina" },
            { time: "17:00", text: "Walk to Jemaa el-Fnaa and the edge of the souks" },
            { time: "19:30", text: "Dinner on a rooftop terrace" },
          ],
        },
        {
          title: "Palaces and gardens",
          items: [
            { time: "09:00", text: "Bahia palace before the tour groups" },
            { time: "11:00", text: "The souks with a local guide" },
            { time: "15:00", text: "Majorelle garden" },
            { time: "19:00", text: "Mint tea and the square at dusk" },
          ],
        },
        {
          title: "Tombs, then nothing",
          items: [
            { time: "09:30", text: "Saadian tombs" },
            { time: "12:30", text: "Lunch in the medina" },
            { time: "14:30", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
      ],
    },
    {
      place: "Imlil",
      summary: "A village in the High Atlas and a day on foot with a guide.",
      days: [
        {
          title: "Up into the High Atlas",
          items: [
            { time: "09:00", text: "Drive to Imlil by Asni, about 2 hours" },
            { time: "12:30", text: "Lunch in the village" },
            { time: "15:00", text: "Easy walk to Aroumd and back" },
          ],
        },
        {
          title: "The valley on foot",
          highlight: "Imlil valley trek",
          items: [
            { time: "08:30", text: "Set off with the local guide" },
            { time: "12:30", text: "Picnic lunch above the river" },
            { time: "16:00", text: "Back in Imlil for mint tea" },
          ],
        },
      ],
    },
    {
      place: "Dades gorge",
      summary: "The mud-brick fortress on the road south, then the gorge itself.",
      days: [
        {
          title: "Over the pass to Aït Benhaddou",
          highlight: "Aït Benhaddou and the Dades gorge",
          items: [
            { time: "08:00", text: "Leave Imlil and cross the Tizi n'Tichka pass" },
            { time: "13:00", text: "Aït Benhaddou, with a guide, and lunch" },
            { time: "15:30", text: "Drive on through Ouarzazate" },
            { time: "19:00", text: "Reach the Dades gorge" },
          ],
        },
        {
          title: "Walking in the gorge",
          items: [
            { time: "09:00", text: "Walk among the rock towers above the gorge" },
            { time: "12:30", text: "Lunch with a view down the valley" },
            { time: "14:30", text: "Empty on purpose. Rest after the long drive.", free: true },
          ],
        },
      ],
    },
    {
      place: "Erg Chebbi camp",
      summary: "A long drive east, camels at sunset and a night in the dunes.",
      days: [
        {
          title: "East to the dunes",
          highlight: "A night under canvas in the dunes",
          items: [
            { time: "08:30", text: "Drive east by Tinghir" },
            { time: "11:00", text: "Stop at the Todra gorge" },
            { time: "16:30", text: "Camels into the dunes at sunset" },
            { time: "20:00", text: "Dinner and drums at the camp" },
          ],
        },
        {
          title: "Dawn, then the long way home",
          items: [
            { time: "06:00", text: "Sunrise from the top of a dune" },
            { time: "08:00", text: "Breakfast, then camels back to the vehicles" },
            { time: "10:00", text: "Drive back to Marrakech, about 9 hours with stops" },
            { time: "19:30", text: "Reach Marrakech for onward travel" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "8", label: "nights, all planned" },
    { value: "3", label: "drives" },
    { value: "29", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Make sure your insurance covers walking in the mountains."],
    },
    {
      topic: "money",
      title: "Money",
      lines: ["Take cash for the souks and the mountain days. Cash machines are rare outside the cities.", "Guides and drivers expect a tip."],
    },
    {
      topic: "customs",
      title: "Dress and manners",
      lines: ["Cover shoulders and knees in towns and villages.", "Ask before you photograph a person."],
    },
    {
      topic: "health",
      title: "Water and heat",
      lines: ["Drink bottled water and carry plenty on the road south.", "Take sun cream, a hat and a warm layer for desert nights."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "On the move. Four stops in eight nights." },
    { label: "Driving", text: "Two long days on the road, one of about 9 hours at the end." },
    { label: "Altitude", text: "Imlil sits at about 1,740 m. Walk slowly on the first day." },
  ],
};
