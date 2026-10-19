import { day } from "../../day";
import type { PresetDetail } from "../../preset-detail-types";

export const JAPAN_GOLDEN_ROUTE: PresetDetail = {
  stops: [
    {
      place: "Tokyo",
      summary: "Markets, shrines, old streets and one empty afternoon.",
      days: [
        day("Land, then Asakusa at dusk", ["15:00 Haneda to the hotel in Asakusa", "17:30 Senso-ji as the lanterns come on", "19:30 Izakaya under the tracks at Yurakucho"]),
        day("Market breakfast and Shibuya", ["08:00 Tsukiji outer market, breakfast standing up", "11:00 teamLab Planets", "17:00 Shibuya Sky for sunset"]),
        day("Meiji shrine, then nothing", ["09:30 Meiji shrine and the walk through Harajuku", "12:30 Ramen in Ebisu", "14:00 ~ Empty on purpose. The group splits up."]),
        day("Old Tokyo and Golden Gai", ["10:00 Yanaka, the old town", "14:00 Ueno park and the museums", "20:00 Golden Gai, six seats to a bar"]),
      ],
    },
    {
      place: "Hakone",
      summary: "The open-air museum and one night in a ryokan.",
      days: [day("Into the hills", ["09:40 Romancecar from Shinjuku", "13:00 Hakone open-air museum", "18:30 Ryokan dinner, then the hot spring"], "A night in a Hakone ryokan")],
    },
    {
      place: "Kyoto",
      summary: "The bullet train, the gates at dawn, the bamboo grove and a day with the deer in Nara.",
      days: [
        day("Lake Ashi, then the bullet train", ["09:00 Boat across Lake Ashi, Fuji if it is clear", "13:10 Shinkansen from Odawara to Kyoto", "19:00 Dinner on Pontocho"], "Shinkansen to Kyoto"),
        day("Fushimi Inari at dawn", ["06:00 The gates before the crowds", "12:00 Nishiki market, lunch as you walk", "18:00 Gion at lantern time"]),
        day("Nara and its deer", ["09:00 Train to Nara, 45 minutes", "10:00 Todai-ji and the great Buddha", "13:00 The deer park and Kasuga shrine", "18:30 Back in Kyoto for dinner"]),
        day("Bamboo, then nothing", ["08:30 Arashiyama bamboo grove and Tenryu-ji", "12:00 Tofu lunch by the river", "14:00 ~ Empty on purpose. The group splits up."]),
      ],
    },
    {
      place: "Hiroshima",
      summary: "The peace park, okonomiyaki, and the floating gate at Miyajima.",
      days: [
        day("West to Hiroshima", ["09:30 Kinkaku-ji on the way out", "13:00 Shinkansen to Hiroshima", "15:30 Peace park and museum", "19:00 Okonomiyaki, layered on the hot plate"]),
        day("Miyajima", ["08:30 Ferry to Miyajima", "10:00 The gate at high tide", "13:00 Ropeway up Mount Misen", "18:00 Back on the mainland"], "Miyajima's gate at high tide"),
      ],
    },
    {
      place: "Osaka",
      summary: "The castle, the markets and a lot of street food.",
      days: [
        day("East to Osaka", ["10:00 Shinkansen to Shin-Osaka", "13:00 Osaka castle and its park", "19:30 Dotonbori, eat until you stop"]),
        day("Markets and Shinsekai", ["10:00 Kuromon market", "14:00 Umeda sky building", "19:00 Kushikatsu in Shinsekai"]),
        day("Home from Kansai", ["09:00 Haruka express to Kansai airport", "12:30 Flight home"]),
      ],
    },
  ],
  inPlan: [
    { value: "13", label: "nights, all planned" },
    { value: "5", label: "train rides" },
    { value: "2", label: "day trips" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    { topic: "before", title: "Before you go", lines: ["Check the entry rules for your passport.", "Book the ryokan and teamLab early. Both sell out."] },
    { topic: "money", title: "Money", lines: ["Carry some cash. Small restaurants and shrines often take no cards.", "No tipping."] },
    { topic: "transport", title: "Trains", lines: ["A seven-day rail pass covers Hakone to Osaka. Use an IC card in the cities.", "A large suitcase needs a reserved space on the bullet train."] },
    { topic: "customs", title: "Hot springs and manners", lines: ["Many baths do not allow tattoos. Ask the ryokan first.", "Shoes off in the ryokan and in some restaurants."] },
  ],
  goodToKnow: [
    { label: "Pace", text: "On the move. Five stops in thirteen nights." },
    { label: "Walking", text: "A lot, mostly flat. One 06:00 start." },
  ],
};
