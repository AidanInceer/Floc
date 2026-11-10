import { Segmented } from "@/components/system/ui";

type Tab = "friends" | "groups";

export function PeopleTabs({ value, onChange, counts }: {
  value: Tab;
  onChange: (tab: Tab) => void;
  counts?: Record<Tab, number>;
}) {
  return (
    <Segmented
      soft
      options={[
        { value: "friends", label: counts ? `Friends · ${counts.friends}` : "Friends" },
        { value: "groups", label: counts ? `Groups · ${counts.groups}` : "Groups" },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}
