const TONES = [
  "bg-pastel-red text-pastel-red-ink",
  "bg-pastel-yellow text-pastel-yellow-ink",
  "bg-pastel-blue text-pastel-blue-ink",
  "bg-pastel-green text-pastel-green-ink",
];

/** A tile's pastel, by its position: the place in the headline and on the rail wears the same one. */
export const tone = (index: number) => TONES[index % TONES.length]!;
