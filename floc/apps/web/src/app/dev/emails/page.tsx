import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageTitle, SectionHeading } from "@/components/system/ui";
import { requireUser } from "@/server/access";
import { emailPreviewOpen } from "@/server/email/dev-preview";
import { renderEmail } from "@/server/email/render";
import { EMAIL_SAMPLES } from "@/server/email/samples";

import { EmailFrame } from "@/components/dev/email-frame";
import { SendSample } from "@/components/dev/send-sample";

export const metadata: Metadata = { title: "Emails" };

/** Every email Floc sends, light and dark, with seeded content (#653). Development only. */
export default async function EmailPreviewPage() {
  if (!emailPreviewOpen()) notFound();
  const me = await requireUser("/dev/emails");
  const now = new Date();

  return (
    <main className="mx-auto w-full max-w-[80rem] px-4 pb-20 pt-6 sm:px-6">
      <PageTitle>Emails</PageTitle>
      {EMAIL_SAMPLES.map((sample) => {
        const mail = sample.build(me.email);
        return (
          <section key={sample.key} className="mt-10 border-t border-rule pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <SectionHeading>{sample.name}</SectionHeading>
                <p className="mt-1 font-mono text-sm text-ink-2">{mail.subject}</p>
              </div>
              <SendSample sampleKey={sample.key} />
            </div>
            <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
              {(["light", "dark"] as const).map((theme) => (
                <EmailFrame key={theme} title={`${sample.name}, ${theme}`} html={renderEmail(mail, { now, theme }).html} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
