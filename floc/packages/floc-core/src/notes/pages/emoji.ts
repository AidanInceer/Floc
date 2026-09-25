/**
 * The `:` picker's emoji (#408). Members may write emoji in their pages;
 * Floc's own UI never draws one. Each entry is the character and the words
 * that find it; the first word names it.
 */
export const EMOJI: readonly (readonly [string, string])[] = [
  ["✈️", "airplane plane flight fly"], ["🚆", "train rail"], ["🚌", "bus coach"], ["🚕", "taxi cab"], ["🚗", "car drive hire"],
  ["🚲", "bike bicycle cycle"], ["⛴️", "ferry boat"], ["🛶", "kayak canoe"], ["🧳", "luggage suitcase bag packing"], ["🎒", "backpack rucksack"],
  ["🗺️", "map route"], ["📍", "pin place location"], ["🧭", "compass"], ["🏨", "hotel stay"], ["🏠", "house home flat"],
  ["⛺", "tent camping"], ["🏖️", "beach umbrella sand"], ["🏝️", "island"], ["🌊", "wave sea ocean surf"], ["⛰️", "mountain hike"],
  ["🌅", "sunrise sunset"], ["☀️", "sun sunny weather"], ["🌧️", "rain weather"], ["❄️", "snow cold"], ["🌙", "moon night"],
  ["🍽️", "dinner food eat plate"], ["🍷", "wine drink"], ["🍺", "beer drink pub"], ["☕", "coffee cafe"], ["🥐", "croissant breakfast"],
  ["🍕", "pizza"], ["🍦", "ice cream"], ["🐟", "fish seafood"], ["🎉", "party celebrate"], ["🎂", "birthday cake"],
  ["🎟️", "ticket tickets"], ["🎭", "theatre show"], ["🎶", "music gig"], ["📸", "camera photo"], ["🛍️", "shopping bags"],
  ["💶", "euro money cash"], ["💷", "pound money cash"], ["💳", "card pay"], ["🧾", "receipt bill"], ["📅", "calendar date day"],
  ["⏰", "alarm clock time early"], ["✅", "done tick yes check"], ["❌", "no cross"], ["⚠️", "warning careful"], ["❓", "question"],
  ["❗", "important"], ["⭐", "star favourite"], ["❤️", "heart love"], ["👍", "thumbs up yes good"], ["👎", "thumbs down no"],
  ["🙏", "thanks please"], ["😀", "smile happy grin"], ["😂", "laugh joy"], ["😍", "love eyes"], ["😴", "sleep tired"],
  ["🤔", "thinking hmm"], ["🥳", "party face"], ["🔥", "fire hot"], ["💡", "idea bulb"], ["📝", "note memo write"],
  ["📌", "pushpin pin"], ["🔑", "key keys"], ["🛂", "passport control"], ["🩴", "flip flops sandals"], ["🧴", "sun cream lotion"],
];

export type EmojiChoice = { emoji: string; name: string };

export function findEmoji(query: string, limit = 40): EmojiChoice[] {
  const q = query.trim().toLowerCase();
  return EMOJI.filter(([, words]) => !q || words.split(" ").some((word) => word.startsWith(q)))
    .slice(0, limit)
    .map(([emoji, words]) => ({ emoji, name: words.split(" ")[0] }));
}
