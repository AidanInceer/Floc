import type { PresetDetail } from "../preset-detail-types";

export const JAPAN_GOLDEN_ROUTE: PresetDetail = {
  stops: [
    {
      place: "Tokyo",
      summary: "Markets, shrines, old streets and one empty afternoon.",
      days: [
        {
          title: "Land, then Asakusa at dusk",
          items: [
            { time: "15:00", text: "Haneda to the hotel in Asakusa" },
            { time: "17:30", text: "Senso-ji as the lanterns come on" },
            { time: "19:30", text: "Izakaya under the tracks at Yurakucho" },
          ],
        },
        {
          title: "Market breakfast and Shibuya",
          items: [
            { time: "08:00", text: "Tsukiji outer market, breakfast standing up" },
            { time: "11:00", text: "teamLab Planets" },
            { time: "17:00", text: "Shibuya Sky for sunset" },
          ],
        },
        {
          title: "Meiji shrine, then nothing",
          items: [
            { time: "09:30", text: "Meiji shrine and the walk through Harajuku" },
            { time: "12:30", text: "Ramen in Ebisu" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Old Tokyo and Golden Gai",
          items: [
            { time: "10:00", text: "Yanaka, the old town" },
            { time: "14:00", text: "Ueno park and the museums" },
            { time: "20:00", text: "Golden Gai, six seats to a bar" },
          ],
        },
      ],
    },
    {
      place: "Hakone",
      summary: "The open-air museum and one night in a ryokan.",
      days: [
        {
          title: "Into the hills",
          highlight: "A night in a Hakone ryokan",
          items: [
            { time: "09:40", text: "Romancecar from Shinjuku" },
            { time: "13:00", text: "Hakone open-air museum" },
            { time: "18:30", text: "Ryokan dinner, then the hot spring" },
          ],
        },
      ],
    },
    {
      place: "Kyoto",
      summary: "The lake, the bullet train, the gates at dawn and the bamboo grove.",
      days: [
        {
          title: "Lake Ashi, then the bullet train",
          highlight: "Shinkansen to Kyoto",
          items: [
            { time: "09:00", text: "Boat across Lake Ashi, Fuji if it is clear" },
            { time: "13:10", text: "Shinkansen from Odawara to Kyoto" },
            { time: "19:00", text: "Dinner on Pontocho" },
          ],
        },
        {
          title: "Fushimi Inari at dawn",
          highlight: "Fushimi Inari at dawn",
          items: [
            { time: "06:00", text: "The gates before the crowds" },
            { time: "12:00", text: "Nishiki market, lunch as you walk" },
            { time: "18:00", text: "Gion at lantern time" },
          ],
        },
        {
          title: "Bamboo, then nothing",
          items: [
            { time: "08:30", text: "Arashiyama bamboo grove and Tenryu-ji" },
            { time: "12:00", text: "Tofu lunch by the river" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
      ],
    },
    {
      place: "Osaka",
      summary: "The golden pavilion on the way, then the castle and street food.",
      days: [
        {
          title: "Golden pavilion, then Osaka",
          items: [
            { time: "09:00", text: "Kinkaku-ji" },
            { time: "11:00", text: "Tea ceremony in a townhouse" },
            { time: "16:00", text: "Train to Osaka" },
            { time: "19:30", text: "Dotonbori, eat until you stop" },
          ],
        },
        {
          title: "Castle and street food",
          items: [
            { time: "10:00", text: "Osaka castle and its park" },
            { time: "13:00", text: "Kuromon market" },
            { time: "19:00", text: "Kushikatsu in Shinsekai" },
          ],
        },
        {
          title: "Home from Kansai",
          items: [
            { time: "09:00", text: "Haruka express to Kansai airport" },
            { time: "12:30", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "10", label: "nights, all planned" },
    { value: "3", label: "train rides" },
    { value: "31", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book the ryokan and teamLab early. Both sell out."],
    },
    {
      topic: "money",
      title: "Money",
      lines: ["Carry some cash. Small restaurants and shrines often take no cards.", "No tipping."],
    },
    {
      topic: "transport",
      title: "Trains",
      lines: ["Get an IC card (Suica or Pasmo) for local trains and buses.", "A large suitcase needs a reserved space on the bullet train."],
    },
    {
      topic: "customs",
      title: "Hot springs and manners",
      lines: ["Many baths do not allow tattoos. Ask the ryokan first.", "Shoes off in the ryokan and in some restaurants."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "On the move. Four stops in ten nights." },
    { label: "Walking", text: "A lot, mostly flat. One 06:00 start." },
  ],
};
