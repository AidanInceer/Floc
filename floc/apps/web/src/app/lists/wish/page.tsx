import { ListsPage } from "@/components/lists/lists-page";
import { NewWishList } from "@/components/lists/wish/new-wish-list";
import { WishInvites } from "@/components/lists/wish/wish-invites";
import { WishListRows } from "@/components/lists/wish/wish-list-rows";
import { PageTitle } from "@/components/system/ui";
import { requireUser } from "@/server/access";
import { peopleSourcesFor } from "@/server/wish-lists/people-sources";
import { listWishListsFor } from "@/server/wish-lists/wish-lists";

export const metadata = { title: "Wish lists" };

/** Wish lists (#623, ADR-049): the lists you keep with other people before any trip exists, and invites to more. */
export default async function WishListsPage() {
  const viewer = await requireUser("/lists/wish");
  const [{ lists, invites }, sources] = await Promise.all([listWishListsFor(viewer.id), peopleSourcesFor(viewer.id)]);

  return (
    <ListsPage current="wish" userId={viewer.id}>
      <PageTitle className="sr-only">Wish lists</PageTitle>
      {invites.length ? <WishInvites invites={invites} /> : null}
      {lists.length ? (
        <>
          <div className="mb-4 flex justify-end">
            <NewWishList sources={sources} variant="secondary" />
          </div>
          <WishListRows lists={lists} />
        </>
      ) : (
        <div className="flex justify-center py-6">
          <NewWishList sources={sources} />
        </div>
      )}
    </ListsPage>
  );
}
