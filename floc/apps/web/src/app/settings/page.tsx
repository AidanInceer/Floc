import { redirect } from "next/navigation";

import { settingsHref } from "@/lib/settings/settings-section";

// Why: settings moved onto Profile; old links, emails and checkout returns still say /settings.
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; billing?: string }>;
}) {
  redirect(settingsHref(await searchParams));
}
