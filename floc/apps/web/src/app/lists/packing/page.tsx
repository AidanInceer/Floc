import { ListsPage } from "@/components/lists/lists-page";
import { PackingLists } from "@/components/lists/packing-lists";
import { PageTitle } from "@/components/system/ui";
import { requireUser } from "@/server/access";
import { listPackingKitsWithItems } from "@/server/packing/packing-kits";

export const metadata = { title: "Packing lists" };

/** Your saved packing lists (#230), now one of the Lists pages (#467). */
export default async function PackingListsPage() {
  const viewer = await requireUser("/lists/packing");
  const kits = await listPackingKitsWithItems(viewer.id);
  return (
    <ListsPage current="packing" userId={viewer.id}>
      <PageTitle className="sr-only">Packing lists</PageTitle>
      <PackingLists kits={kits} />
    </ListsPage>
  );
}
