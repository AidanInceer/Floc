const SMALL = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "the", "to", "via", "with",
]);

const upperFirst = (part: string) => part.charAt(0).toUpperCase() + part.slice(1);

function capitalise(part: string): string {
  const elided = /^([dl]')(.+)$/i.exec(part);
  return elided ? elided[1].toLowerCase() + upperFirst(elided[2]) : upperFirst(part);
}

/** A trip name as shown, never as stored: main words capitalised, small words low unless first. */
export function titleCase(name: string): string {
  return name
    .split(" ")
    .map((word, index) =>
      index > 0 && SMALL.has(word.toLowerCase()) ? word : word.split("-").map(capitalise).join("-"),
    )
    .join(" ");
}
