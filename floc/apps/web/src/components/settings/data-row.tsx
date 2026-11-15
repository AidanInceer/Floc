import { updateMarketingEmail } from "@/app/settings/actions";
import { ToggleRow } from "@/components/auth/account-ui";
import { AutoSaveForm } from "@/components/settings/auto-save-form";
import { CookieSettings } from "@/components/settings/cookie-settings";
import { SettingsRow } from "@/components/settings/settings-row";
import { panelTitleClass } from "@/components/system/ui";
import type { ConsentChoice } from "@floc/core/consent/consent";
import { dataSummary } from "@floc/core/people/settings-summary";

/** Your data: the cookie choice for this browser, and consent to advertising email for the account. */
export function DataRow({
  id,
  open,
  consent,
  advertisingEmail,
}: {
  id: string;
  open: boolean;
  consent: ConsentChoice | null;
  advertisingEmail: boolean;
}) {
  return (
    <SettingsRow id={id} open={open} title="Your data" summary={dataSummary(consent, advertisingEmail)}>
      <div className="flex flex-col gap-5">
        <section aria-labelledby="data-cookies" className="flex flex-col gap-3">
          <h3 id="data-cookies" className={panelTitleClass}>Cookies on this device</h3>
          <CookieSettings fromServer={consent} />
        </section>
        <AutoSaveForm action={updateMarketingEmail} className="flex flex-col gap-4 border-t border-rule pt-5">
          <ToggleRow
            name="marketingEmail"
            label="Advertising email"
            hint="News about Floc features and offers. You can turn this off at any time."
            defaultChecked={advertisingEmail}
          />
        </AutoSaveForm>
      </div>
    </SettingsRow>
  );
}
