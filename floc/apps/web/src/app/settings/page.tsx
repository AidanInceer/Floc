import { redirect } from "next/navigation";

import { settingsHref } from "@/lib/settings/settings-section";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; billing?: string }>;
}) {
  redirect(settingsHref(await searchParams));
}
