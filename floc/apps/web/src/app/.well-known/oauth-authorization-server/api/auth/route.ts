import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";

import { auth } from "@/server/auth/auth";

export const dynamic = "force-dynamic";

export const GET = oauthProviderAuthServerMetadata(auth as never);
