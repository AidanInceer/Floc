"use client";

import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";

export function SignOutButton({
  className,
  role,
}: {
  className?: string;
  role?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      role={role}
      onClick={async () => {
        await signOut();
        router.push("/");
        router.refresh();
      }}
      /* The only caller is the account menu, which passes the shared item
         class so this row's hover block lines up with Profile and Settings. */
      className={
        className ??
        "rounded-sm px-2 py-1 text-sm text-ink-faint hover:bg-sheet-2 hover:text-ink"
      }
    >
      Sign out
    </button>
  );
}
