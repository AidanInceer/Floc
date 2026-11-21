import { NextResponse, type NextRequest } from "next/server";

import { isRefusal } from "@floc/core/errors/refusal";
import { joinsOnArrival } from "@floc/core/people/welcome/link-join";

import { memberSessionStart } from "@/server/access";
import { findTripByShareLink, joinWithLink } from "@/server/trips/invites";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const back = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);
  const invitePage = `/invite/${encodeURIComponent(token)}`;

  const mode = request.headers.get("sec-fetch-mode");
  if (mode !== null && mode !== "navigate") return back(invitePage);

  const session = await memberSessionStart();
  if (!session || !joinsOnArrival({ sessionStartedAt: session.startedAt, now: new Date() })) return back(invitePage);

  const found = await findTripByShareLink(token);
  if (!found) return back(invitePage);

  try {
    await joinWithLink(found.id, session.userId);
  } catch (error) {
    if (isRefusal(error)) return back(`${invitePage}?full=1`);
    throw error;
  }
  return back(`/trip/${found.id}/overview`);
}
