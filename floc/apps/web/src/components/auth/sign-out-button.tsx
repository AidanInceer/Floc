"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/lib/auth-client";
import { trySignOut } from "@/lib/sign-out";
import { SignOutIcon } from "@/components/chrome/account/account-icons";

export function SignOutButton({
  className,
  role,
}: {
  className?: string;
  role?: string;
}) {
  const router = useRouter();
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <button
      type="button"
      role={role}
      onClick={async () => {
        const failed = await trySignOut(() => signOut());
        setProblem(failed);
        if (failed) return;
        router.push("/");
        router.refresh();
      }}
      className={
        className ??
        "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] text-ink-soft hover:bg-sheet-3 hover:text-ink"
      }
    >
      <SignOutIcon />
      <span aria-live="polite" className={problem ? "text-red" : undefined}>
        {problem ?? "Sign out"}
      </span>
    </button>
  );
}
