import { ConfirmSubmit, Menu, SubmitButton } from "@/components/system/client-ui";
import { cx, menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import type { BagAction, BagMenuItem } from "@floc/core/packing/packing-bag";

const ROW = "!flex items-center gap-2.5 hover:!transform-none hover:!shadow-none";

function BagMenuWords({ item }: { item: BagMenuItem }) {
  return (
    <>
      <span className="min-w-0 flex-1">{item.label}</span>
      {item.count === null ? null : (
        <span className="font-mono text-[11px] tabular-nums text-ink-faint">{item.count}</span>
      )}
    </>
  );
}

function BagMenuRow({ item, action }: { item: BagMenuItem; action: () => Promise<void> }) {
  return (
    <form action={action}>
      {item.confirm ? (
        <ConfirmSubmit
          role="menuitem"
          variant="ghost"
          confirmVariant={item.action === "unpack" ? "primary" : "danger"}
          message={item.confirm.message}
          detail={item.confirm.detail}
          confirmLabel={item.confirm.confirmLabel}
          className={cx(item.danger ? menuDangerItemClass : menuItemClass, ROW)}
        >
          <BagMenuWords item={item} />
        </ConfirmSubmit>
      ) : (
        <SubmitButton role="menuitem" variant="ghost" className={cx(menuItemClass, ROW)}>
          <BagMenuWords item={item} />
        </SubmitButton>
      )}
    </form>
  );
}

export function PackingBagMore({
  items,
  actions,
}: {
  items: BagMenuItem[];
  actions: Record<BagAction, () => Promise<void>>;
}) {
  if (items.length === 0) return null;
  return (
    <Menu label="More for your bag">
      {items.map((item) => (
        <BagMenuRow key={item.action} item={item} action={actions[item.action]} />
      ))}
    </Menu>
  );
}
