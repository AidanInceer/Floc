import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ConnectChoice } from "@/components/auth/connect-choice";
import { ButtonLink, panelTitleClass } from "@/components/system/ui";
import { requireUser } from "@/server/access";
import { readConnectRequest } from "@/server/auth/connected-apps";

export const metadata: Metadata = { title: "Connect an app", robots: { index: false, follow: false } };

const CAN_SEE = [
  "Your trips and who is on them",
  "Days, stays, events and their notes",
  "Packing lists, including your own bag",
  "Who owes who",
];

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function queryOf(params: Record<string, string | string[] | undefined>): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of [value ?? []].flat()) query.append(key, item);
  }
  return query;
}

export default async function ConnectPage({ searchParams }: Props) {
  const query = queryOf(await searchParams);
  await requireUser(`/connect?${query}`);
  const app = await readConnectRequest(query);

  if (!app) {
    return (
      <AuthShell title="This request has ended" blurb="Start again from the app you were connecting.">
        <ButtonLink href="/trips" className="w-full">Back to your trips</ButtonLink>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={`Connect ${app.name}`}
      blurb={app.host ? <span className="break-all font-mono text-ink">{app.host}</span> : "This app gave no web address."}
    >
      <div className="flex flex-col gap-4">
        <section aria-labelledby="connect-sees" className="flex flex-col gap-2">
          <h2 id="connect-sees" className={panelTitleClass}>It can see</h2>
          <ul className="flex flex-col divide-y divide-rule border-b border-rule text-sm">
            {CAN_SEE.map((line) => (
              <li key={line} className="py-2">{line}</li>
            ))}
          </ul>
        </section>
        <div className="flex flex-col gap-1 text-sm text-ink-soft">
          <p>It cannot change anything.</p>
          {app.returnsTo ? (
            <p>
              You go back to <span className="break-all font-mono text-ink">{app.returnsTo}</span>
            </p>
          ) : null}
        </div>
        <ConnectChoice oauthQuery={query.toString()} />
      </div>
    </AuthShell>
  );
}
