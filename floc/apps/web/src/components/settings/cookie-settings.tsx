"use client";

import { useRouter } from "next/navigation";

import type { ConsentChoice } from "@floc/core/consent/consent";

import { ConsentRows } from "@/components/chrome/consent/consent-choices";
import { useConsent } from "@/components/chrome/consent/use-consent";
import { AutoSaveForm } from "@/components/settings/auto-save-form";
import { chooseConsent } from "@/lib/consent/consent-cookie";

export function CookieSettings({ fromServer }: { fromServer: ConsentChoice | null }) {
  const consent = useConsent(fromServer);
  const router = useRouter();

  const save = async (data: FormData) => {
    chooseConsent({ functional: data.has("functional"), analytics: data.has("analytics") });
    router.refresh();
  };

  return (
    <AutoSaveForm action={save} className="flex flex-col gap-4">
      <ConsentRows consent={consent} />
    </AutoSaveForm>
  );
}
