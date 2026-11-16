import { today } from "@floc/core/dates/dates";
import { requireUser } from "@/server/access";
import { listFriendsFor } from "@/server/social/friends";
import { listGroupsFor, listPastTripsFor } from "@/server/social/groups";
import { PageTitle } from "@/components/system/ui";
import { AccountTabs } from "@/components/chrome/account-tabs";
import { FriendsBoard } from "@/components/social/groups/friends-board";

export const metadata = { title: "Groups" };

export default async function GroupsPage() {
  const viewer = await requireUser("/friends/groups");
  const [friends, groups, pastTrips] = await Promise.all([
    listFriendsFor(viewer.id),
    listGroupsFor(viewer.id),
    listPastTripsFor(viewer.id, today()),
  ]);

  return (
    <>
      <AccountTabs current="groups" userId={viewer.id} />
      <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
        <PageTitle className="sr-only">Groups</PageTitle>
        <div className="mx-auto max-w-[41.25rem]">
          <FriendsBoard show="groups" friends={friends.map((person) => ({ person, metOn: null }))} groups={groups} pastTrips={pastTrips} />
        </div>
      </div>
    </>
  );
}
