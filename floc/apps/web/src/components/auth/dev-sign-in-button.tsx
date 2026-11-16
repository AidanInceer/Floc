"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Select } from "@/components/system/ui";
import type { DevAccount } from "@/server/auth/dev-accounts";

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
