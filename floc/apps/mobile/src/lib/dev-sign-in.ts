import { signIn } from "./auth";
import { API_BASE_URL } from "./config";

export type DevAccount = { email: string; name: string; password: string };

export async function devAccounts(): Promise<DevAccount[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dev/sign-in`);
    if (!response.ok) return null;
    const body = (await response.json()) as {
      email: string;
      password: string;
      accounts?: DevAccount[];
    };
    if (body.accounts?.length) return body.accounts;
    return [{ email: body.email, name: "Dev account", password: body.password }];
  } catch {
    return null;
  }
}

export async function devSignIn(account?: DevAccount): Promise<string | null> {
  const chosen = account ?? (await devAccounts())?.[0];
  if (!chosen) {
    return "No dev account. Set FLOC_DEV_USER_EMAIL and FLOC_DEV_USER_PASSWORD in the web .env.";
  }

  const { error } = await signIn.email({
    email: chosen.email,
    password: chosen.password,
  });
  if (!error) return null;
  return `Sign-in failed at ${API_BASE_URL}: ${error.message ?? error.statusText ?? error.status}`;
}
