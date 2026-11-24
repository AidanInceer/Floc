"use server";

import { headers } from "next/headers";

import { requireUser } from "@/server/access";
import { auth } from "@/server/auth/auth";

type ConsentApi = {
  oauth2Consent(request: {
    headers: Headers;
    body: { accept: boolean; oauth_query: string };
  }): Promise<{ url?: string }>;
};

const ENDED = "This request has ended. Start again from the app.";

export async function answerConnect(oauthQuery: string, accept: boolean): Promise<{ url?: string; error?: string }> {
  await requireUser();
  try {
    const { url } = await (auth.api as unknown as ConsentApi).oauth2Consent({
      headers: await headers(),
      body: { accept, oauth_query: oauthQuery },
    });
    return url ? { url } : { error: ENDED };
  } catch {
    return { error: ENDED };
  }
}
