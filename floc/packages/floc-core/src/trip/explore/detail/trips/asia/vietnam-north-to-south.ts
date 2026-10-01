import type { PresetDetail } from "../../preset-detail-types";

export const VIETNAM_NORTH_TO_SOUTH: PresetDetail = {
  stops: [
    {
      place: "Hanoi",
      summary: "The Old Quarter, the temples and a lot of street food.",
      days: [
        {
          title: "Land, then the Old Quarter",
          items: [
            { time: "14:00", text: "Noi Bai airport to the hotel, about 45 minutes" },
            { time: "16:30", text: "Walk the Old Quarter and Hoan Kiem lake" },
            { time: "19:00", text: "Bun cha for dinner" },
          ],
        },
        {
          title: "Temples and puppets",
          items: [
            { time: "08:30", text: "Temple of Literature" },
            { time: "11:00", text: "Ba Dinh square and the One Pillar pagoda" },
            { time: "14:00", text: "Hoa Lo prison museum" },
            { time: "19:30", text: "Water puppet theatre" },
          ],
        },
        {
          title: "Eat your way round",
          items: [
            { time: "09:00", text: "Street food walk through the Old Quarter" },
            { time: "13:00", text: "Egg coffee by the lake" },
            { time: "16:00", text: "Hanoi cathedral and the lanes behind it" },
          ],
        },
      ],
    },
    {
      place: "Lan Ha bay",
      summary: "One night on a boat among the limestone islands.",
      days: [
        {
          title: "Onto the bay",
          highlight: "Lan Ha bay overnight",
          items: [
            { time: "08:00", text: "Bus from Hanoi to Cat Ba harbour, about 3 hours" },
            { time: "12:00", text: "Board the boat and cruise Lan Ha bay" },
            { time: "15:00", text: "Kayak among the limestone islands" },
            { time: "19:00", text: "Dinner and a night on the boat" },
          ],
        },
      ],
    },
    {
      place: "Hội An",
      summary: "The sleeper south, a mountain road, a cooking class and two slow days.",
      days: [
        {
          title: "Off the bay, onto the sleeper",
          items: [
            { time: "08:00", text: "Breakfast and a last cruise through the bay" },
            { time: "11:30", text: "Back to the harbour, then the bus to Hanoi" },
            { time: "19:00", text: "Overnight train south from Hanoi" },
          ],
        },
        {
          title: "Over the Hải Vân pass",
          highlight: "Hải Vân pass by car",
          items: [
            { time: "08:30", text: "Arrive in Hue off the sleeper, then drive south" },
            { time: "11:00", text: "Hải Vân pass and its lookouts" },
            { time: "13:00", text: "Lunch by the sea in Da Nang" },
            { time: "16:00", text: "Check in in Hội An" },
          ],
        },
        {
          title: "Market and cooking class",
          highlight: "Cooking class in Hội An",
          items: [
            { time: "08:30", text: "Market visit and cooking class" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
            { time: "18:30", text: "Lanterns on the Thu Bon river" },
          ],
        },
        {
          title: "A free day",
          items: [
            { time: "09:00", text: "Bicycles through the rice fields to An Bang beach" },
            { time: "13:00", text: "Empty on purpose. Swim, read or shop for tailoring.", free: true },
            { time: "19:00", text: "Dinner in the old town" },
          ],
        },
      ],
    },
    {
      place: "Ho Chi Minh City",
      summary: "Fly south for the markets, the museums and the tunnels.",
      days: [
        {
          title: "Fly south",
          items: [
            { time: "09:30", text: "Flight from Da Nang to Ho Chi Minh City, 1h 20" },
            { time: "13:00", text: "Lunch and Ben Thanh market" },
            { time: "15:30", text: "War Remnants Museum" },
            { time: "19:00", text: "Dinner in District 1" },
          ],
        },
        {
          title: "Tunnels and the old centre",
          items: [
            { time: "08:30", text: "Cu Chi tunnels, about 90 minutes by road" },
            { time: "14:00", text: "Notre-Dame cathedral and the old post office" },
            { time: "18:30", text: "Street food on the way back to the hotel" },
          ],
        },
      ],
    },
    {
      place: "Mekong delta",
      summary: "Canals, a dawn floating market and a boat or two.",
      days: [
        {
          title: "Into the delta",
          items: [
            { time: "08:00", text: "Drive to Can Tho, about 3 hours 30" },
            { time: "12:30", text: "Lunch by the river" },
            { time: "15:00", text: "Small boat along the narrow canals" },
            { time: "19:00", text: "Dinner in Can Tho" },
          ],
        },
        {
          title: "Floating market at dawn",
          items: [
            { time: "05:30", text: "Cai Rang floating market by boat" },
            { time: "09:30", text: "Rice noodle workshop" },
            { time: "15:00", text: "Fruit orchards by bicycle" },
          ],
        },
        {
          title: "Home from Saigon",
          items: [
            { time: "08:00", text: "Drive back to Ho Chi Minh City, about 3 hours 30" },
            { time: "14:00", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "12", label: "nights, all planned" },
    { value: "4", label: "rides" },
    { value: "41", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book the sleeper berths early. They sell out in season."],
    },
    {
      topic: "money",
      title: "Money",
      lines: ["Vietnam uses the dong. Cash machines are common in cities.", "Carry cash for markets, boats and the delta."],
    },
    {
      topic: "transport",
      title: "Sleeper and traffic",
      lines: ["Berths on the night train are in shared cabins. Keep valuables close.", "Cross busy roads at a steady pace and the bikes will flow round you."],
    },
    {
      topic: "health",
      title: "Water and food",
      lines: ["Drink bottled water.", "Ask your travel clinic about vaccines well before you leave."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "On the move. Five stops, one night train and one flight." },
    { label: "Walking", text: "Mostly easy. One night on a boat and one 05:30 start." },
  ],
};
