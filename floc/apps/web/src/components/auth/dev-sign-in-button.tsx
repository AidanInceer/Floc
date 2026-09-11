"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Select } from "@/components/system/ui";
import type { DevAccount } from "@/server/auth/dev-accounts";

/**
 * The web half of the dev door (#no-ticket), the twin of the phone's.
 *
 * POST is the browser verb: Better Auth's own response carries the
 * `Set-Cookie`, so the session is the one a typed sign-in would produce. The
 * login page only renders this when the server says the door is open, and it
 * passes the roster in rather than letting this fetch it — the list is a
 * server read, and a client that could ask for it could ask on production.
 *
 * The picker only appears once `pnpm db:seed` has made somebody to pick.
 */
export function DevSignInButton({ accounts }: { accounts: DevAccount[] }) {
  const router = useRouter();
  const [email, setEmail] = useState(accounts[0]?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setProblem(null);
    const response = await fetch(
      `/api/dev/sign-in?email=${encodeURIComponent(email)}`,
      { method: "POST" },
    );
    if (!response.ok) {
      setBusy(false);
      setProblem(`Dev sign-in failed: ${response.status} ${response.statusText}`);
      return;
    }
    router.push("/trips");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {accounts.length > 1 ? (
        <Select
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Sign in as"
        >
          {accounts.map((a) => (
            <option key={a.email} value={a.email}>
              {a.name}
            </option>
          ))}
        </Select>
      ) : null}
      <Button type="button" variant="danger" disabled={busy} onClick={signIn}>
        Dev sign in
      </Button>
      {accounts.length === 1 ? (
        <p className="text-sm text-ink-soft">
          Run pnpm db:seed to sign in as somebody else.
        </p>
      ) : null}
      {problem ? <p className="text-sm text-red">{problem}</p> : null}
    </div>
  );
}
