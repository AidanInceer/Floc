"use client";

import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";
import { SignOutIcon } from "@/components/chrome/account/account-icons";

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
      className={
        className ??
        "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] text-ink-soft hover:bg-sheet-3 hover:text-ink"
      }
    >
      <SignOutIcon />
      Sign out
    </button>
  );
}
