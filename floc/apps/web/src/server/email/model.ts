/**
 * What a Floc email says, apart from how it is drawn (#653, ADR-062). `render.ts` turns one into HTML and text.
 */
import type { SectionColour } from "@floc/core/design/section-colours";
import type { TripColor } from "@floc/core/trip/trip-color";

type MailTone = SectionColour;

export type MailRow = {
  text: string;
  /** A second, quieter line: why a file was left out. */
  note?: string;
  tag?: { word: string; tone: MailTone };
  /** The person the row is about, drawn as their initials in their seat colour. */
  person?: string;
};

export type OutboundEmail = {
  to: string;
  subject: string;
  /** A card for account and booking mail; a letter for mail about a trip. */
  layout?: "card" | "letter";
  /** The card's heading; the subject when absent. A letter has none. */
  heading?: string;
  lines: string[];
  cta?: { label: string; url: string };
  note?: string;
  /** Mono label and value pairs. */
  facts?: [string, string][];
  /** Draws the facts in an outlined box headed by these, with no fill. */
  box?: { title: string; status: string };
  /** Numbered "What to do" steps. */
  steps?: string[];
  rows?: MailRow[];
  /** A message quoted as written. */
  quote?: string[];
  trip?: { name: string; dates: string; colour: TripColor };
  /** Why this mail came; every mail says it. */
  why?: string;
  /** Only a notice links to the setting that stops it. */
  settingsUrl?: string;
  /** CTA carries a credential; keep it out of production logs (#149). */
  sensitive?: boolean;
  /** Where an answer goes: the member who wrote in, for mail to Floc's own mailbox (#271). */
  replyTo?: string;
};
