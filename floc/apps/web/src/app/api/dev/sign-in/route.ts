import { auth } from "@/server/auth/auth";
import { listDevAccounts, passwordFor } from "@/server/auth/dev-accounts";
import { devSignInEnabled } from "@/server/auth/dev-sign-in";

export const runtime = "nodejs";

const notFound = (): Response => new Response("Not found", { status: 404 });

export async function GET(): Promise<Response> {
  if (!devSignInEnabled()) return notFound();

  const accounts = await listDevAccounts();
  return Response.json({
    email: process.env.FLOC_DEV_USER_EMAIL,
    password: process.env.FLOC_DEV_USER_PASSWORD,
    accounts: accounts.map((a) => ({
      ...a,
      password: passwordFor(a.email),
    })),
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!devSignInEnabled()) return notFound();

  const email = new URL(request.url).searchParams.get("email");
  const password = passwordFor(email);
  if (!password) return notFound();

  return auth.api.signInEmail({
    body: { email: email ?? process.env.FLOC_DEV_USER_EMAIL!, password },
    asResponse: true,
  });
}
