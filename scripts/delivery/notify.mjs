import { spawnSync } from "node:child_process";

// Why: Windows only shows toasts from a registered app id; PowerShell's own is always registered.
const APP_ID = "{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe";

const SCRIPT = [
  "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null",
  "$t = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)",
  "$x = $t.GetElementsByTagName('text')",
  "$x.Item(0).AppendChild($t.CreateTextNode($env:FLOC_TITLE)) > $null",
  "$x.Item(1).AppendChild($t.CreateTextNode($env:FLOC_BODY)) > $null",
  `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${APP_ID}').Show([Windows.UI.Notifications.ToastNotification]::new($t))`,
].join("; ");

export function notify(title, body) {
  console.log(`${new Date().toISOString()} ${title}: ${body}`);
  if (process.platform !== "win32") return;
  spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", SCRIPT], {
    env: { ...process.env, FLOC_TITLE: title, FLOC_BODY: body }, windowsHide: true, stdio: "ignore",
  });
}
