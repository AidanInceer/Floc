import "server-only";

import type { Viewer } from "@floc/api/port";
import { and, desc, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { oauthAccessToken, oauthClient, oauthConsent, oauthRefreshToken, user } from "@/db/schema";
import { bounded, LIMITS } from "@/server/limits";

export type ConnectedApp = { clientId: string; name: string; host: string | null };

const APP_NAME_CAP = 60;

function hostOf(address: string | null): string | null {
  if (!address) return null;
  try {
    return new URL(address).hostname;
  } catch {
    return null;
  }
}

export async function agentViewer(claims: { sub?: unknown; azp?: unknown }): Promise<Viewer | null> {
  const { sub, azp } = claims;
  if (typeof sub !== "string" || typeof azp !== "string") return null;
  const row = await db
    .select({ id: user.id, name: user.name, email: user.email, image: user.image })
    .from(oauthConsent)
    .innerJoin(user, eq(user.id, oauthConsent.userId))
    .innerJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
    .where(
      and(
        eq(oauthConsent.userId, sub),
        eq(oauthConsent.clientId, azp),
        eq(user.isAnonymous, false),
        or(isNull(oauthClient.disabled), eq(oauthClient.disabled, false)),
      ),
    )
    .get();
  return row ?? null;
}

function returnPlace(redirectUri: string | null): string | null {
  if (!redirectUri) return null;
  try {
    const url = new URL(redirectUri);
    return url.hostname || url.protocol.replace(":", "");
  } catch {
    return null;
  }
}

export async function readConnectRequest(
  query: URLSearchParams,
): Promise<{ name: string; host: string | null; returnsTo: string | null } | null> {
  const clientId = query.get("client_id");
  if (!clientId || Number(query.get("exp")) * 1000 < Date.now()) return null;
  const client = await db
    .select({ name: oauthClient.name, disabled: oauthClient.disabled })
    .from(oauthClient)
    .where(eq(oauthClient.clientId, clientId))
    .get();
  if (!client || client.disabled) return null;
  const host = hostOf(clientId);
  return {
    name: (client.name ?? host ?? "an app").slice(0, APP_NAME_CAP),
    host,
    returnsTo: returnPlace(query.get("redirect_uri")),
  };
}

export async function listConnectedApps(userId: string): Promise<ConnectedApp[]> {
  const rows = await db
    .select({ clientId: oauthConsent.clientId, name: oauthClient.name })
    .from(oauthConsent)
    .innerJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
    .where(eq(oauthConsent.userId, userId))
    .orderBy(desc(oauthConsent.createdAt))
    .limit(LIMITS.connectedApps);
  return bounded(rows, "connectedApps", "connected-apps").map((row) => {
    const host = hostOf(row.clientId);
    return { clientId: row.clientId, name: (row.name ?? host ?? "An app").slice(0, APP_NAME_CAP), host };
  });
}

export async function disconnectApp(userId: string, clientId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(oauthAccessToken).where(and(eq(oauthAccessToken.userId, userId), eq(oauthAccessToken.clientId, clientId)));
    await tx.delete(oauthRefreshToken).where(and(eq(oauthRefreshToken.userId, userId), eq(oauthRefreshToken.clientId, clientId)));
    await tx.delete(oauthConsent).where(and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)));
  });
}
