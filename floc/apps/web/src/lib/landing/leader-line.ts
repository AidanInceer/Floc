export type Box = { left: number; top: number; right: number; bottom: number; width: number; height: number };
export type Point = { x: number; y: number };

// The line leaves a note beside its title, not its middle, so a long note still points from its heading.
const TITLE_DROP = 22;
// Ends just inside the device frame, so the dot sits on the window edge rather than floating off it.
const INSET = 6;

/**
 * A curved line from a note to the row it describes. It ends at the device's
 * edge, not the row: on the web page rows sit in two columns, and a line into
 * the far column would cross the near one.
 */
export function leaderLine(note: Box, device: Box, row: Box): { start: Point; end: Point; d: string } {
  const fromLeft = note.right < device.left + 10;
  const start = { x: fromLeft ? note.right : note.left, y: note.top + TITLE_DROP };
  const end = { x: fromLeft ? device.left + INSET : device.right - INSET, y: row.top + row.height / 2 };
  const mid = (start.x + end.x) / 2;
  return { start, end, d: `M${start.x} ${start.y} C${mid} ${start.y} ${mid} ${end.y} ${end.x} ${end.y}` };
}
