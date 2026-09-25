import { AccountPage, Panel } from "@/components/auth/account-ui";
import { EmptyState } from "@/components/system/ui";

export const metadata = { title: "Privacy policy" };

type StoredItem = { name: string; purpose: string; lasts: string };

const strictlyNecessary: StoredItem[] = [
  {
    name: "better-auth.session_token",
    purpose: "Keeps you signed in.",
    lasts: "60 days, renewed while you use Floc",
  },
  {
    name: "better-auth.session_data",
    purpose: "Saves checking your sign-in on every page.",
    lasts: "1 minute",
  },
  {
    name: "better-auth.dont_remember",
    purpose: "Signs you out when you close the browser, if you asked not to be remembered.",
    lasts: "Until you close the browser",
  },
  {
    name: "better-auth.oauth_state",
    purpose: "Protects sign-in with Google.",
    lasts: "10 minutes",
  },
  {
    name: "floc-notes:*",
    purpose: "A copy of each notes page you open, so what you write offline is kept and sent when you are back online. Kept in your browser.",
    lasts: "Until you clear your browser",
  },
];

const functional: StoredItem[] = [
  {
    name: "floc-theme",
    purpose: "Remembers light or dark mode. Kept in your browser, not sent to us.",
    lasts: "Until you change it or clear your browser",
  },
  {
    name: "floc-folds:*",
    purpose: "Remembers which headings you folded on each notes page. Kept in your browser, not sent to us.",
    lasts: "Until you change it or clear your browser",
  },
];

function StoredItemTable({ items }: { items: StoredItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-ink-soft">
          <tr>
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Purpose</th>
            <th className="py-2 font-medium">Lasts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {items.map((item) => (
            <tr key={item.name}>
              <td className="py-2 pr-4 font-mono text-xs">{item.name}</td>
              <td className="py-2 pr-4">{item.purpose}</td>
              <td className="py-2 text-ink-soft">{item.lasts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <AccountPage eyebrow="Legal" title="Privacy policy">
      <Panel
        title="Cookies"
        hint="No cookie or stored choice lasts longer than 12 months. On secure connections, cookie names start with __Secure-."
      >
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="text-sm font-semibold">Strictly necessary</h3>
            <p className="mt-1 text-sm text-ink-soft">Floc does not work without these, so they are always on.</p>
            <div className="mt-3">
              <StoredItemTable items={strictlyNecessary} />
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold">Functional</h3>
            <div className="mt-3">
              <StoredItemTable items={functional} />
            </div>
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
