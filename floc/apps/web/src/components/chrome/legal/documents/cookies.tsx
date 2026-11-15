import { ANALYTICS_KEEP_DAYS } from "@floc/core/analytics/events";
import { CONSENT_CATEGORIES } from "@floc/core/consent/consent";

import { ConsentChoices } from "@/components/chrome/consent/consent-choices";
import { STORAGE_LIST } from "@/lib/legal/storage-list";
import { requestConsent } from "@/server/consent/consent";

import { LegalSection } from "../legal-prose";

const CATEGORY_LABELS = Object.fromEntries(CONSENT_CATEGORIES.map((c) => [c.key, c.label]));

export async function CookiesDocument() {
  const consent = await requestConsent();
  return (
    <>
      <LegalSection title="Your choice">
        <p>Floc asks once, and again after 12 months. You can change your answer here at any time.</p>
        <ConsentChoices fromServer={consent} />
      </LegalSection>

      <LegalSection title="What Floc stores on your device">
        <p>Floc sets no advertising cookies and no cookies from other companies.</p>
        <div className="overflow-x-auto">
        <table>
          <thead>
            <tr><th>Name</th><th>Kind</th><th>Group</th><th>What it is for</th><th>How long</th></tr>
          </thead>
          <tbody>
            {STORAGE_LIST.map((thing) => (
              <tr key={thing.name}>
                <td className="whitespace-nowrap font-mono">{thing.name}</td>
                <td>{thing.kind}</td>
                <td>{CATEGORY_LABELS[thing.category]}</td>
                <td>{thing.purpose}</td>
                <td>{thing.lasts}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <p>On floc.live the cookie names start with <span className="font-mono">__Secure-</span>.</p>
      </LegalSection>

      <LegalSection title="Counting page views">
        <p>
          With your yes, Floc counts which kinds of page are opened, on the website and in the app. It is our own
          count, kept in our own database. No other company receives it.
        </p>
        <ul>
          <li>Each count holds the kind of page (for example a trip&rsquo;s Money tab, never which trip), whether it was the website or the app, and the time.</li>
          <li>It holds no cookie, no account, no name and no internet address, so a count cannot be tied to you.</li>
          <li>Counts are deleted after {Math.round(ANALYTICS_KEEP_DAYS / 30.4)} months.</li>
          <li>Without your yes, nothing is counted.</li>
        </ul>
      </LegalSection>
    </>
  );
}
