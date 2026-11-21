import { closeDayGaps, findDayGaps } from "./day-gaps.ts";

const apply = process.argv.includes("--apply");
const gaps = await findDayGaps();

for (const gap of gaps) console.log(`#${gap.tripId} ${gap.name}: ${gap.dates.join(", ")}`);
console.log(`${gaps.length} trip(s) with a gap.`);

if (apply && gaps.length) {
  await closeDayGaps(gaps);
  console.log("Each missing day is back, empty.");
} else if (gaps.length) {
  console.log("Nothing written. Run again with --apply to bring the days back.");
}
