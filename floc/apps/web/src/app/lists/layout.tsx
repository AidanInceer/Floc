import type { ReactNode } from "react";

import { AccountTabs } from "@/components/chrome/account-tabs";

export default function ListsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AccountTabs current="lists" />
      <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
        <div className="mx-auto max-w-[54rem]">
          {children}
        </div>
      </div>
    </>
  );
}
