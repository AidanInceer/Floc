/**
 * Saved packing lists (ticket 230). Yours, not a trip's — a photography kit or
 * gym stuff you copy into a bag whenever you need it.
 *
 * Built from the same card, strips and rows as the Packing tab on purpose: a
 * saved list and a bag are the same object at two moments, so one of them
 * looking like a settings form and the other like a checklist would be two
 * designs for one idea.
 */
import { PageTitle } from "@/components/system/ui";
import {
  addKitItem,
  createPackingKit,
  deleteKit,
  removeKitItem,
  renameKit,
  stepKitItemQuantity,
} from "./actions";
import {
  MAX_PACK_QUANTITY,
  MIN_PACK_QUANTITY,
  viewPackingLines,
} from "@floc/core/packing/packing";
import { requireUser } from "@/server/access";
import { listPackingKitsWithItems } from "@/server/packing/packing-kits";
import {
  PackingCard,
  PackingCardEmpty,
  PackingCount,
  PackingGroup,
} from "@/components/packing/packing-card";
import { PackingKitRow } from "@/components/packing/packing-kit-row";
import { CategorySelect } from "@/components/packing/packing-controls";
import { ConfirmSubmit, SubmitButton } from "@/components/system/client-ui";

export const metadata = { title: "Packing lists" };

export default async function PackingListsPage() {
  const viewer = await requireUser("/packing-lists");

  const kits = await listPackingKitsWithItems(viewer.id);

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <PageTitle>Saved lists</PageTitle>

      <section className="mt-6 rounded-xl border border-rule bg-sheet px-4 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <h2 className="typed !mb-0">Start a list</h2>
          <form
            action={createPackingKit}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-3"
          >
            <label className="min-w-[14rem] flex-1">
              <span className="sr-only">Name</span>
              <input
                name="name"
                required
                maxLength={80}
                placeholder="Photography"
                className={boxClass}
              />
            </label>
            <SubmitButton pendingLabel="Making it…">Make the list</SubmitButton>
          </form>
        </div>

        <p className="mt-2 max-w-prose text-sm text-ink-soft">
          Kit you take again and again. Copy one into your bag on any trip and
          edit it there — the trip never changes what&rsquo;s saved here.
        </p>
      </section>

      {kits.map((kit) => {
        const groups = viewPackingLines(kit.items, {
          sort: "category",
          category: "all",
        });

        return (
          <section key={kit.id}>
            <PackingCard
              header={
                <>
                  <h2 className="typed !mb-0">{kit.name}</h2>
                  <PackingCount total={kit.items.length} packed={0} />
                </>
              }
              tools={
                <form
                  action={addKitItem.bind(null, kit.id)}
                  className="flex min-w-0 flex-1 flex-wrap items-center gap-3"
                >
                  <label className="min-w-[14rem] flex-1">
                    <span className="sr-only">Add something to {kit.name}</span>
                    <input
                      name="label"
                      required
                      maxLength={200}
                      placeholder="Something to pack…"
                      className={boxClass}
                    />
                  </label>
                  <label>
                    <span className="sr-only">How many</span>
                    <input
                      name="quantity"
                      type="number"
                      defaultValue={1}
                      min={MIN_PACK_QUANTITY}
                      max={MAX_PACK_QUANTITY}
                      className="w-20 rounded-md border border-rule-strong bg-sheet px-3 py-2.5 text-center font-mono text-sm tabular-nums"
                    />
                  </label>
                  <CategorySelect />
                  <SubmitButton pendingLabel="Adding…">
                    Add to the list
                  </SubmitButton>
                </form>
              }
              footer={
                <>
                  <form
                    action={renameKit.bind(null, kit.id)}
                    className="flex min-w-0 flex-1 items-center gap-2"
                  >
                    <label className="min-w-[10rem] max-w-[20rem] flex-1">
                      <span className="sr-only">Rename {kit.name}</span>
                      <input
                        name="name"
                        required
                        maxLength={80}
                        defaultValue={kit.name}
                        className="w-full rounded-md border border-rule bg-sheet px-3 py-1.5 text-sm focus-visible:border-pen"
                      />
                    </label>
                    <SubmitButton variant="ghost" pendingLabel="Saving…">
                      Rename
                    </SubmitButton>
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
                </>
              }
            >
              {groups.length === 0 ? (
                <PackingCardEmpty title="Nothing in it yet.">
                  Add the things you always take, and the counts you take them
                  in.
                </PackingCardEmpty>
              ) : (
                groups.map((group) => (
                  <PackingGroup
                    key={group.key}
                    heading={group.heading}
                    count={group.lines.length}
                    pinned={false}
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
                  </PackingGroup>
                ))
              )}
            </PackingCard>
          </section>
        );
      })}
    </div>
  );
}

/** The add box, the same one both packing lists use. */
const boxClass =
  "w-full rounded-md border border-rule bg-sheet px-4 py-2.5 text-sm placeholder:text-ink-faint focus-visible:border-pen";
