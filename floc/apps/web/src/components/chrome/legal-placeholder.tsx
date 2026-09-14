import { AccountPage, Panel } from "@/components/auth/account-ui";
import { EmptyState } from "@/components/system/ui";

export function LegalPlaceholder({ title }: { title: string }) {
  return (
    <AccountPage eyebrow="Legal" title={title}>
      <Panel>
        <EmptyState title="Not written yet" />
      </Panel>
    </AccountPage>
  );
}
