/** Why: the panel takes rows and callbacks, so everything that talks to a server lives here. */
import { readIdeaSort, type IdeaSort } from "@floc/core/trip/ideas";
import { TEXT_CAPS } from "@floc/core/text/text";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";

import { Button, Failed, Loading, SearchField } from "../../system/ui";
import { IdeasPanel } from "./ideas-panel";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export function IdeasSection({ tripId, datesUnset }: { tripId: number; datesUnset: boolean }) {
  const queryClient = useQueryClient();
  const ideas = useQuery(trpc.ideas.list.queryOptions({ tripId }));

  const [open, setOpen] = useState(datesUnset);
  const [sort, setSort] = useState<IdeaSort>("votes");
  const [title, setTitle] = useState("");

  const again = () =>
    queryClient.invalidateQueries({ queryKey: trpc.ideas.list.queryKey({ tripId }) });

  const add = useMutation({
    ...trpc.ideas.add.mutationOptions(),
    onSuccess: () => {
      setTitle("");
      again();
    },
  });
  const vote = useMutation({ ...trpc.ideas.vote.mutationOptions(), onSuccess: again });
  const remove = useMutation({ ...trpc.ideas.remove.mutationOptions(), onSuccess: again });

  if (ideas.isPending) return <Loading />;
  if (ideas.isError) return <Failed onRetry={() => ideas.refetch()} />;

  return (
    <IdeasPanel
      ideas={ideas.data.map((idea) => ({
        id: idea.id,
        title: idea.title,
        createdAt: new Date(idea.createdAt),
        authorId: idea.createdBy,
        authorName: idea.authorName,
        authorAvatarIcon: idea.authorAvatarIcon,
        votes: idea.votes,
        mine: idea.mine,
      }))}
      open={open}
      sort={sort}
      onToggle={() => setOpen(!open)}
      onSort={(next) => setSort(readIdeaSort(next))}
      onVote={(ideaId) => vote.mutate({ tripId, ideaId })}
      onRemove={(ideaId) => remove.mutate({ tripId, ideaId })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <SearchField
            placeholder="Lisbon, a week in September…"
            value={title}
            onChangeText={setTitle}
            maxLength={TEXT_CAPS.ideaTitle}
            autoCapitalize="sentences"
            onSubmitEditing={() => title.trim() && add.mutate({ tripId, title })}
          />
        </View>
        <Button
          label="Add"
          fit="small"
          busy={add.isPending}
          disabled={title.trim().length === 0}
          onPress={() => add.mutate({ tripId, title })}
        />
      </View>
    </IdeasPanel>
  );
}
