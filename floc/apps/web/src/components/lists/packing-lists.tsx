import {
  addKitItem,
  createPackingKit,
  deleteKit,
  removeKitItem,
  renameKit,
  stepKitItemQuantity,
} from "@/app/lists/packing/actions";
import {
  MAX_PACK_QUANTITY,
  MIN_PACK_QUANTITY,
  viewPackingLines,
} from "@floc/core/packing/packing";
import { PackingCount } from "@/components/packing/packing-card";
import { PackingCube } from "@/components/packing/packing-cube";
import { PackingKitRow } from "@/components/packing/packing-kit-row";
import { CategorySelect } from "@/components/packing/packing-controls";
import { ConfirmSubmit, SubmitButton } from "@/components/system/client-ui";

import type { listPackingKitsWithItems as Load } from "@/server/packing/packing-kits";

const boxClass =
  "w-full rounded-sm border border-rule bg-sheet px-4 py-2.5 text-sm placeholder:text-ink-faint focus-visible:border-pen";

type Kit = Awaited<ReturnType<typeof Load>>[number];

/** Your saved packing lists (#230), one of the Lists pages (#467). */
export function PackingLists({ kits }: { kits: Kit[] }) {
  return (
    <section aria-label="Packing lists">
      <div className="rounded-md border border-rule bg-sheet px-4 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <form
            action={createPackingKit}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-3"
          >
            <label className="min-w-0 flex-1 basis-full sm:min-w-[14rem] sm:basis-auto">
              <span className="typed mb-1.5 block">Start a list</span>
              <input
                name="name"
                required
                maxLength={80}
                className={boxClass}
              />
            </label>
            <SubmitButton>Make the list</SubmitButton>
          </form>
        </div>
        <p className="mt-2 max-w-prose text-sm text-ink-soft">
          Keep the things you take again and again. Add a list to any trip&rsquo;s bag,
          then tailor it for that trip.
        </p>
      </div>

      {kits.map((kit) => (
        <KitSection key={kit.id} kit={kit} />
      ))}
    </section>
  );
}

/** One saved packing list: its things in cubes, then rename and delete. */
function KitSection({ kit }: { kit: Kit }) {
  const groups = viewPackingLines(kit.items, {
    sort: "category",
    category: "all",
  });

  return (
    <section id={`kit-${kit.id}`} className="mt-9 scroll-mt-24">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl">{kit.name}</h2>
        <PackingCount total={kit.items.length} packed={0} />
      </header>

      <form
        action={addKitItem.bind(null, kit.id)}
        className="mt-4 flex flex-wrap items-stretch gap-2 rounded-md border border-rule bg-sheet p-3"
      >
        <label className="min-w-0 basis-full flex-1 sm:basis-auto">
          <span className="sr-only">Add something to {kit.name}</span>
          <input
            name="label"
            required
            maxLength={200}
            className={boxClass}
          />
        </label>
        <label className="shrink-0">
          <span className="sr-only">How many</span>
          <input
            name="quantity"
            type="number"
            defaultValue={1}
            min={MIN_PACK_QUANTITY}
            max={MAX_PACK_QUANTITY}
            className="w-20 rounded-sm border border-rule-strong bg-sheet px-3 py-2.5 text-center font-mono text-sm tabular-nums"
          />
        </label>
        <CategorySelect />
        <SubmitButton className="shrink-0">Add to list</SubmitButton>
      </form>

      {groups.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">Start this list above.</p>
      ) : (
        <div className="mt-4 grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <PackingCube
              key={group.key}
              heading={group.heading ?? "All items"}
              total={group.lines.length}
            >
              {group.lines.map((item) => (
                <PackingKitRow
                  key={item.id}
                  itemId={item.id}
                  label={item.label}
                  quantity={item.quantity}
                  step={stepKitItemQuantity}
                  remove={removeKitItem}
                />
              ))}
            </PackingCube>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <form action={renameKit.bind(null, kit.id)} className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <label className="min-w-0">
            <span className="sr-only">Rename {kit.name}</span>
            <input
              name="name"
              required
              maxLength={80}
              defaultValue={kit.name}
              className="w-full rounded-sm border border-rule bg-sheet px-3 py-1.5 text-sm focus-visible:border-pen"
            />
          </label>
          <SubmitButton variant="ghost">Rename</SubmitButton>
        </form>
        <form action={deleteKit.bind(null, kit.id)}>
          <ConfirmSubmit
            variant="ghost"
            confirmVariant="danger"
            label={`Delete ${kit.name}`}
            message={`Delete "${kit.name}"? Bags you've already filled from it keep their things.`}
            confirmLabel="Delete it"
            className="!px-3 !text-red hover:!bg-red-soft hover:!text-red"
          >
            Delete list
          </ConfirmSubmit>
        </form>
      </div>
    </section>
  );
}
