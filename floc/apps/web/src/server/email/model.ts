import type { SectionColour } from "@floc/core/design/section-colours";
import type { TripColor } from "@floc/core/trip/trip-color";

type MailTone = SectionColour;

export type MailRow = {
  text: string;
  note?: string;
  tag?: { word: string; tone: MailTone };
  person?: string;
};

export type OutboundEmail = {
  to: string;
  subject: string;
  layout?: "card" | "letter";
  heading?: string;
  lines: string[];
  cta?: { label: string; url: string };
  note?: string;
  facts?: [string, string][];
  box?: { title: string; status: string };
  steps?: string[];
  rows?: MailRow[];
  quote?: string[];
  trip?: { name: string; dates: string; colour: TripColor };
  why?: string;
  settingsUrl?: string;
  sensitive?: boolean;
  replyTo?: string;
};
