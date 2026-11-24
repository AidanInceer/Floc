import { disconnectConnectedApp } from "@/app/settings/actions";
import { SettingsRow } from "@/components/settings/settings-row";
import { ActionForm, SubmitButton } from "@/components/system/client-ui";
import type { ConnectedApp } from "@/server/auth/connected-apps";

export function ConnectedAppsRow({ id, open, apps }: { id: string; open: boolean; apps: ConnectedApp[] }) {
  if (apps.length === 0) return null;
  return (
    <SettingsRow id={id} open={open} title="Connected apps" summary={apps.length === 1 ? apps[0].name : `${apps.length} apps`}>
      <ul className="flex flex-col divide-y divide-rule">
        {apps.map((app) => (
          <li key={app.clientId} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block break-words text-sm">{app.name}</span>
              {app.host ? <span className="block break-all font-mono text-xs text-ink-faint">{app.host}</span> : null}
            </span>
            <ActionForm action={disconnectConnectedApp} className="shrink-0">
              <input type="hidden" name="clientId" value={app.clientId} />
              <SubmitButton variant="ghost">Disconnect</SubmitButton>
            </ActionForm>
          </li>
        ))}
      </ul>
    </SettingsRow>
  );
}
