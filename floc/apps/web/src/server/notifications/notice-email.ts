import { formatDateRange } from "@floc/core/dates/dates";
import { featureTag } from "@floc/core/notifications/feature-tag";
import type { ActivityKind } from "@floc/core/notifications/rules";
import { readTripColor, tripPastel } from "@floc/core/trip/trip-color";

import { appUrl } from "@/lib/env";
import { settingsHref } from "@/lib/settings/settings-section";
import type { MailRow, OutboundEmail } from "@/server/email/model";

export type NoticeTrip = { id: number; name: string; startDate: string | null; endDate: string | null; colorKey: string | null };

type Notice = {
  to: string;
  title: string;
  href: string;
  lines: string[];
  parts: { kind: ActivityKind; actor: string | null }[];
  trip: NoticeTrip | null;
};

const url = (path: string) => new URL(path, appUrl()).toString();

function row(text: string, part: Notice["parts"][number] | undefined): MailRow {
  const tag = part ? featureTag(part.kind) : null;
  return {
    text,
    ...(part?.actor ? { person: part.actor } : {}),
    ...(tag ? { tag: { word: tag.word, tone: tag.colour } } : {}),
  };
}

/** One notice, or several on one trip, as a letter (#653, ADR-062): the trip as a tile, several as rows. */
export function noticeEmail({ to, title, href, lines, parts, trip }: Notice): OutboundEmail {
  const several = lines.length > 1;
  const subject = several ? `${lines.length} new things on ${title}` : lines[0];
  return {
    to,
    subject,
    layout: "letter",
    lines: [subject],
    ...(several ? { rows: lines.map((text, i) => row(text, parts[i])) } : {}),
    ...(trip
      ? { trip: { name: trip.name, dates: formatDateRange(trip.startDate, trip.endDate), colour: tripPastel(readTripColor(trip.colorKey), trip.id) } }
      : {}),
    cta: { label: "Open in Floc", url: url(href) },
    why: "Floc emails you only when push can't reach you.",
    settingsUrl: url(settingsHref({ section: "notifications" })),
  };
}
