import type { PresetDetail } from "../../preset-detail-types";

export const RAJASTHAN_FORTS_AND_PALACES: PresetDetail = {
  stops: [
    {
      place: "Delhi",
      summary: "One night to land, rest and see a tomb before the train.",
      days: [
        {
          title: "Land and Humayun's tomb",
          items: [
            { time: "12:00", text: "Airport to the hotel" },
            { time: "15:00", text: "Humayun's tomb" },
            { time: "19:00", text: "Dinner in Old Delhi" },
          ],
        },
      ],
    },
    {
      place: "Jaipur",
      summary: "The pink city, a hilltop fort and a day of bazaars.",
      days: [
        {
          title: "Train to the pink city",
          items: [
            { time: "06:15", text: "Morning train from New Delhi to Jaipur, about four hours" },
            { time: "11:30", text: "Hawa Mahal and the old city walk" },
            { time: "14:00", text: "City Palace" },
            { time: "19:30", text: "Dinner in the old city" },
          ],
        },
        {
          title: "Amber fort",
          highlight: "Amber fort",
          items: [
            { time: "08:00", text: "Amber fort, before the tour buses" },
            { time: "12:30", text: "Lunch near the fort" },
            { time: "17:30", text: "Sunset at Nahargarh fort" },
          ],
        },
        {
          title: "Block printing, then nothing",
          items: [
            { time: "09:30", text: "Block-printing workshop" },
            { time: "12:30", text: "Lunch in the bazaar" },
            { time: "15:00", text: "Empty on purpose. The group splits up.", free: true },
          ],
        },
      ],
    },
    {
      place: "Jodhpur",
      summary: "The blue city under a huge fort.",
      days: [
        {
          title: "Long drive west",
          items: [
            { time: "08:00", text: "Drive from Jaipur to Jodhpur, about six hours" },
            { time: "13:00", text: "Lunch stop on the highway" },
            { time: "17:00", text: "Clock tower and Sardar market" },
          ],
        },
        {
          title: "Mehrangarh and the blue lanes",
          highlight: "Mehrangarh at golden hour",
          items: [
            { time: "09:00", text: "Mehrangarh fort with the audio guide" },
            { time: "13:00", text: "Lunch in the blue lanes of the old city" },
            { time: "17:30", text: "Golden hour on the fort from an old town rooftop" },
          ],
        },
      ],
    },
    {
      place: "Udaipur",
      summary: "The lake city: palaces, boats and a last slow evening.",
      days: [
        {
          title: "Drive to the lakes",
          items: [
            { time: "08:00", text: "Drive from Jodhpur to Udaipur, about five hours" },
            { time: "12:00", text: "Ranakpur Jain temples on the way" },
            { time: "18:00", text: "First walk by the lake" },
          ],
        },
        {
          title: "City Palace and the lake",
          highlight: "Boat on Lake Pichola",
          items: [
            { time: "10:00", text: "City Palace" },
            { time: "14:00", text: "Empty on purpose. The group splits up.", free: true },
            { time: "17:30", text: "Boat on Lake Pichola at sunset" },
          ],
        },
        {
          title: "Gardens and a dance show",
          items: [
            { time: "09:00", text: "Saheliyon ki Bari gardens" },
            { time: "11:30", text: "Jagdish temple and the lanes around it" },
            { time: "19:00", text: "Folk dance show at a haveli" },
          ],
        },
        {
          title: "Home from Udaipur",
          items: [
            { time: "09:00", text: "Transfer to Udaipur airport" },
            { time: "12:30", text: "Flight home" },
          ],
        },
      ],
    },
  ],
  inPlan: [
    { value: "9", label: "nights, all planned" },
    { value: "3", label: "rides" },
    { value: "28", label: "places, with times" },
    { value: "2", label: "empty afternoons" },
  ],
  advice: [
    {
      topic: "before",
      title: "Before you go",
      lines: ["Check the entry rules for your passport.", "Book the Jaipur train seats early. Morning trains fill up."],
    },
    {
      topic: "transport",
      title: "Drives",
      lines: ["A car with a driver covers the two long drives. Allow extra time on the roads.", "Start early to beat the traffic."],
    },
    {
      topic: "health",
      title: "Food and water",
      lines: ["Drink bottled or filtered water only.", "Talk to a travel clinic about vaccines well before you go."],
    },
    {
      topic: "weather",
      title: "Weather",
      lines: ["October to March is the cooler season.", "Mornings can be cold in December and January."],
    },
  ],
  goodToKnow: [
    { label: "Pace", text: "Steady. Four stops in nine nights." },
    { label: "Driving", text: "Two long drives of five and six hours." },
    { label: "Walking", text: "Forts mean ramps and steps. Wear good shoes." },
  ],
};
