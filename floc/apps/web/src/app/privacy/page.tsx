import { AccountPage, Panel } from "@/components/auth/account-ui";
import { EmptyState } from "@/components/system/ui";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <AccountPage eyebrow="Legal" title="Privacy policy">
      <Panel
        title="Cookies"
        hint="No cookie or stored choice lasts longer than 12 months."
      >
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="text-sm font-semibold">Strictly necessary</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Floc does not work without these, so they are always on. They keep you signed in, protect
              sign-in with Google, and keep a copy of the notes pages you open so nothing you write offline
              is lost.
            </p>
          </section>
          <section>
            <h3 className="text-sm font-semibold">Functional</h3>
            <p className="mt-1 text-sm text-ink-soft">
              These remember your choices, such as light or dark mode and which note headings you folded.
              They stay in your browser and are not sent to us.
            </p>
          </section>
          <section>
            <h3 className="text-sm font-semibold">Analytics</h3>
            <p className="mt-1 text-sm text-ink-soft">None. If we add analytics, we will ask you first.</p>
          </section>
          <section>
            <h3 className="text-sm font-semibold">Advertising</h3>
            <p className="mt-1 text-sm text-ink-soft">None. Floc does not use advertising cookies.</p>
          </section>
        </div>
      </Panel>
      <Panel>
        <EmptyState title="The rest of the policy is not written yet" />
      </Panel>
    </AccountPage>
  );
}
