/** On a friend's Saved part (#623): a wish list with them, filled with what you both saved. They get an invite. */
import { firstName } from "@floc/core/people/group-ticks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { PlusGlyph } from "@/components/system/glyphs";
import { Body, Button } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export function StartWishWith({ friendId, name }: { friendId: string; name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const start = useMutation({
    ...trpc.wishes.startWith.mutationOptions(),
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: trpc.wishes.list.queryKey() });
      router.push({ pathname: "/(app)/wish/[id]", params: { id: String(id) } });
    },
  });
  return (
    <View style={{ gap: space.xs }}>
      <Button
        label={`Start a wish list with ${firstName(name)}`}
        variant="quiet"
        icon={(ink) => <PlusGlyph color={ink} />}
        busy={start.isPending}
        onPress={() => start.mutate({ friendId })}
      />
      {start.isError ? <Body tone="red">{start.error.message}</Body> : null}
    </View>
  );
}
