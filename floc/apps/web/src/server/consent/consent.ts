import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { CONSENT_COOKIE, readConsent, type ConsentChoice } from "@floc/core/consent/consent";
import { today } from "@floc/core/dates/dates";

/** The visitor's consent choice for this request (#368). Null means they have not been asked, or it lapsed. */
export const requestConsent = cache(async (): Promise<ConsentChoice | null> =>
  readConsent((await cookies()).get(CONSENT_COOKIE)?.value, today()));
