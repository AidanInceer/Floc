import type { PresetDetail } from "../../preset-detail-types";

export const BALI_VILLA_WEEK: PresetDetail = {
  stops: [
    {
      place: "Ubud",
      summary: "Rice terraces, temples, a volcano sunrise and slow afternoons by the pool.",
      days: [
        {
          title: "Land, then the market",
          items: [
            { time: "14:00", text: "Airport to the villa in Ubud, about an hour and a half" },
            { time: "17:00", text: "Ubud art market and the main street" },
            { time: "19:30", text: "Dinner in the village" },
          ],
        },
        {
          title: "Terraces and a water temple",
          highlight: "Tegallalang terraces early",
          items: [
            { time: "07:30", text: "Tegallalang rice terraces before the crowds" },
            { time: "10:30", text: "Tirta Empul water temple" },
            { time: "13:00", text: "Lunch with a view of the paddies" },
          ],
        },
        {
          title: "Volcano sunrise",
          highlight: "Mount Batur sunrise walk",
          items: [
            { time: "03:00", text: "Pick-up from the villa" },
            { time: "05:45", text: "Sunrise from the Mount Batur summit" },
            { time: "10:00", text: "Breakfast, then back to the villa" },
            { time: "14:00", text: "Empty on purpose. The group sleeps.", free: true },
          ],
        },
        {
          title: "Ridge walk and monkeys",
          items: [
            { time: "07:00", text: "Campuhan ridge walk" },
            { time: "09:30", text: "Sacred Monkey Forest Sanctuary" },
            { time: "13:00", text: "Balinese cooking class" },
          ],
        },
      ],
    },
    {
      place: "Canggu",
      summary: "Surf lessons, beach clubs and long lunches by the sea.",
      days: [
        {
          title: "Drive to the coast",
          items: [
            { time: "10:00", text: "Drive from Ubud to Canggu, about an hour and a half" },
            { time: "13:00", text: "Long lunch near Batu Bolong beach" },
            { time: "16:30", text: "Sunset on Echo Beach" },
          ],
        },
        {
          title: "First surf lesson",
          highlight: "Surf lesson for beginners",
          items: [
            { time: "08:00", text: "Beginner surf lesson with an instructor" },
            { time: "12:30", text: "Lunch on the beach" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
        {
          title: "Paddies and a sea temple",
          items: [
            { time: "09:00", text: "Walk through the rice paddies behind Canggu" },
            { time: "13:00", text: "Lunch at a cafe by the beach" },
            { time: "16:30", text: "Tanah Lot temple at sunset" },
          ],
        },
        {
          title: "Pool and last dinner",
          items: [
            { time: "09:00", text: "Pool morning at the villa" },
            { time: "12:00", text: "Lunch in Canggu" },
            { time: "19:00", text: "Last dinner, all of you" },
          ],
        },
        {
          title: "Home from Denpasar",
          items: [
            { time: "09:00", text: "Drive to the airport, allow for traffic" },
            { time: "12:30", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "8", label: "nights, all planned" },
    { value: "1", label: "drive" },
    { value: "25", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book the Mount Batur guide ahead. Walks start in the dark."],
    },
    {
      topic: "transport",
      title: "Getting around",
      lines: ["A car with a driver is easy to find. Ride apps are patchy around Ubud.", "Traffic can double any drive."],
    },
    {
      topic: "customs",
      title: "Temples",
      lines: ["Cover shoulders and knees. Most temples lend a sarong.", "Do not step on the small offerings left on the ground."],
    },
    {
      topic: "weather",
      title: "Weather",
      lines: ["May to September is the dry season.", "Bring a warm layer for the Mount Batur summit."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Easy. Two villas in eight nights, one 03:00 start." },
    { label: "Driving", text: "One 90 minute drive. Expect more in traffic." },
  ],
};
