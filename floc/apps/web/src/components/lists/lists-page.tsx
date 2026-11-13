import type { ReactNode } from "react";

import { AccountTabs } from "@/components/chrome/account-tabs";

/** A Lists page under the account bar. Saved is wider, so a tile's figures and Start trip share one line (#467). */
export function ListsPage({ current, userId, children, wide = current === "saved" }: { current: "saved" | "wish" | "packing"; userId: string; children: ReactNode; wide?: boolean }) {
  return (
    <>
      <AccountTabs current={current} userId={userId} />
      <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
        <div className={wide ? "mx-auto max-w-[64rem]" : "mx-auto max-w-[54rem]"}>{children}</div>
      </div>
    </>
  );
}
