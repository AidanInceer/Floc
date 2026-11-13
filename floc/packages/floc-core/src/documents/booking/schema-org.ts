/**
 * Reads the schema.org reservation some booking mails carry (#559): JSON-LD blocks and microdata.
 *
 * Why the limits: the HTML is a forwarded mail, so it is hostile input. The reader looks at a
 * capped slice, a capped number of blocks and nodes, never runs or fetches anything, and skips
 * what it cannot read rather than throwing. Every value it finds goes through
 * `cleanBookingDetails` before it is used.
 */
import { cleanBookingDetails, type BookingDetails } from "./booking-details";

const MAX_HTML = 400_000;
const MAX_TAG = 4000;
const MAX_BLOCK = 100_000;
const MAX_BLOCKS = 20;
const MAX_NODES = 400;
const MAX_DEPTH = 8;
const MAX_TAGS = 20_000;
const MAX_OPEN = 200;
const MAX_VALUE = 200;

type Node = Record<string, unknown>;

const isNode = (value: unknown): value is Node => !!value && typeof value === "object" && !Array.isArray(value);

function typeOf(node: Node): string {
  const raw: unknown = node["@type"];
  const name: unknown = Array.isArray(raw) ? raw[0] : raw;
  return typeof name === "string" ? (name.split("/").pop() ?? "") : "";
}

/** The first node under a property, when a mail gives a list where one thing is meant. */
function child(node: Node | null, key: string): Node | null {
  const value: unknown = node?.[key];
  const first: unknown = Array.isArray(value) ? value[0] : value;
  return isNode(first) ? first : null;
}

function fromFlight(node: Node): unknown {
  const flight = child(node, "reservationFor");
  const airline = child(flight, "airline") ?? child(flight, "provider");
  const number = typeof flight?.flightNumber === "string" ? flight.flightNumber.trim() : "";
  const code = typeof airline?.iataCode === "string" ? airline.iataCode : "";
  return {
    kind: "flight",
    flightNumber: /^\d/.test(number) && code ? `${code}${number}` : number,
    date: flight?.departureTime,
    departTime: flight?.departureTime,
    arriveTime: flight?.arrivalTime,
    from: child(flight, "departureAirport")?.iataCode,
    to: child(flight, "arrivalAirport")?.iataCode,
    reference: node.reservationNumber,
  };
}

function fromLodging(node: Node): unknown {
  return {
    kind: "hotel",
    name: child(node, "reservationFor")?.name,
    checkIn: node.checkinTime ?? node.checkinDate,
    checkOut: node.checkoutTime ?? node.checkoutDate,
    reference: node.reservationNumber,
  };
}

function reservationOf(node: Node): BookingDetails | null {
  const type = typeOf(node);
  if (type === "FlightReservation") return cleanBookingDetails(fromFlight(node));
  if (type === "LodgingReservation") return cleanBookingDetails(fromLodging(node));
  return null;
}

type Queued = { value: unknown; depth: number };

/** What to look at under a value: a list's items, or a node's `@graph`. Nothing past the depth limit. */
function under({ value, depth }: Queued): Queued[] {
  if (depth >= MAX_DEPTH) return [];
  const next: unknown = Array.isArray(value) ? value.slice(0, 50) : isNode(value) ? value["@graph"] : null;
  if (Array.isArray(next)) return next.map((item: unknown) => ({ value: item, depth: depth + 1 }));
  return next ? [{ value: next, depth: depth + 1 }] : [];
}

function reservationIn(roots: unknown[]): BookingDetails | null {
  const queue: Queued[] = roots.map((value) => ({ value, depth: 0 }));
  for (let seen = 0; seen < MAX_NODES; seen += 1) {
    const item = queue.shift();
    if (!item) return null;
    const details = isNode(item.value) ? reservationOf(item.value) : null;
    if (details) return details;
    queue.push(...under(item));
  }
  return null;
}

const JSON_LD_TYPE = /type\s*=\s*["']?application\/ld\+json/i;

/**
 * Why `indexOf` and no pattern over the whole mail: a pattern that looks for a tag's end from every tag's start
 * takes seconds on a mail made of unclosed tags, and the server answers nobody while it runs. Each step here
 * moves forward and never looks at the same text twice.
 */
function jsonLdBlocks(html: string): unknown[] {
  const lower = html.toLowerCase();
  const blocks: unknown[] = [];
  let at = 0;
  for (let scripts = 0; scripts < MAX_BLOCKS * 5 && blocks.length < MAX_BLOCKS; scripts += 1) {
    const start = lower.indexOf("<script", at);
    const tagEnd = start < 0 ? -1 : html.indexOf(">", start);
    const end = tagEnd < 0 ? -1 : lower.indexOf("</script", tagEnd);
    if (end < 0) break;
    at = end + 8;
    const body = html.slice(tagEnd + 1, end);
    if (body.length > MAX_BLOCK || !JSON_LD_TYPE.test(html.slice(start, Math.min(tagEnd, start + MAX_TAG)))) continue;
    try {
      blocks.push(JSON.parse(body) as unknown);
    } catch {
      // A broken block is skipped: the mail may carry another, or a barcode.
    }
  }
  return blocks;
}

const VOID_TAGS = new Set(["meta", "link", "img", "br", "hr", "input", "area", "base", "col", "embed", "source", "track", "wbr"]);

function attribute(attrs: string, name: string): string | null {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i").exec(attrs);
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : null;
}

/** The words between an element's tags, with any tags inside dropped. One pass, capped. */
function plainText(fragment: string): string {
  let text = "";
  let inTag = false;
  for (let at = 0; at < fragment.length && at < MAX_TAG && text.length < MAX_VALUE * 2; at += 1) {
    const char = fragment[at];
    if (char === "<") inTag = true;
    else if (char === ">") inTag = false;
    text += inTag || char === ">" ? " " : char;
  }
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_VALUE);
}

type Open = { tag: string; scope: Node | null; textProp: string | null; owner: Node | null; textFrom: number };

/** Microdata as the same tree JSON-LD gives, so one reader serves both. */
class Microdata {
  readonly roots: Node[] = [];
  private readonly stack: Open[] = [];

  constructor(private readonly html: string) {}

  private owner(): Node | null {
    for (let at = this.stack.length - 1; at >= 0; at -= 1) {
      const scope = this.stack[at].scope;
      if (scope) return scope;
    }
    return null;
  }

  /** A closing tag ends its element; an element that was a plain property takes its text as the value. */
  close(tag: string, at: number): void {
    const index = this.stack.map((open) => open.tag).lastIndexOf(tag);
    if (index < 0) return;
    const open = this.stack[index];
    this.stack.length = index;
    if (open.textProp && open.owner) open.owner[open.textProp] ??= plainText(this.html.slice(open.textFrom, at));
  }

  /** Files a new scope under its property, or as a root when it hangs off nothing. */
  private place(scope: Node, prop: string | null, owner: Node | null): void {
    if (prop && owner) owner[prop] ??= scope;
    else this.roots.push(scope);
  }

  open(tag: string, attrs: string, textFrom: number): void {
    const prop = attribute(attrs, "itemprop");
    const owner = this.owner();
    const given = attribute(attrs, "content") ?? attribute(attrs, "datetime");
    const scope: Node | null = /\bitemscope\b/i.test(attrs) ? { "@type": attribute(attrs, "itemtype") ?? "" } : null;
    const plain = prop !== null && owner !== null && scope === null;

    if (scope) this.place(scope, prop, owner);
    else if (plain && given !== null) owner[prop] ??= given.slice(0, MAX_VALUE);

    const selfClosed = VOID_TAGS.has(tag) || attrs.trimEnd().endsWith("/");
    if (selfClosed || this.stack.length >= MAX_OPEN) return;
    this.stack.push({ tag, scope, textProp: plain && given === null ? prop : null, owner, textFrom });
  }
}

const TAG_NAME = /^\/?([a-zA-Z][a-zA-Z0-9]*)/;

/** Walks the tags left to right with `indexOf`, for the reason given at `jsonLdBlocks`. A tag past the cap is skipped. */
function microdataRoots(html: string): Node[] {
  const reader = new Microdata(html);
  let at = 0;
  for (let tags = 0; tags < MAX_TAGS; tags += 1) {
    const start = html.indexOf("<", at);
    const end = start < 0 ? -1 : html.indexOf(">", start + 1);
    if (end < 0) break;
    at = end + 1;
    if (end - start > MAX_TAG) continue;
    const inner = html.slice(start + 1, end);
    const name = TAG_NAME.exec(inner);
    if (!name) continue;
    const tag = name[1].toLowerCase();
    if (inner.startsWith("/")) reader.close(tag, start);
    else reader.open(tag, inner.slice(name[0].length), at);
  }
  return reader.roots;
}

/** The first flight or hotel reservation in a mail's HTML, or null. Never throws. */
export function readSchemaOrg(html: unknown): BookingDetails | null {
  if (typeof html !== "string" || !html) return null;
  const slice = html.slice(0, MAX_HTML);
  try {
    return reservationIn(jsonLdBlocks(slice)) ?? (slice.includes("itemscope") ? reservationIn(microdataRoots(slice)) : null);
  } catch {
    return null;
  }
}
