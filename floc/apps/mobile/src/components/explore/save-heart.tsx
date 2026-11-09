import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet } from "react-native";

import { ReactionGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { trpc } from "@/lib/api";
import { radius } from "@/lib/theme";

/** Your saved Explore trips, read once and shared by every heart on screen (#467). */
export function useSavedTrips() {
  const queryClient = useQueryClient();
  const key = trpc.explore.saves.queryKey();
  const saves = useQuery(trpc.explore.saves.queryOptions());
  const set = useMutation({
    ...trpc.explore.setSaved.mutationOptions(),
    // Why: the heart answers under the finger; the server's list replaces it, right or wrong, when the write settles.
    onMutate: async ({ presetId, saved }) => {
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData<string[]>(key, (ids = []) =>
        saved ? [presetId, ...ids.filter((id) => id !== presetId)] : ids.filter((id) => id !== presetId),
      );
      return undefined;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  return {
    ids: saves.data ?? [],
    pending: saves.isPending,
    failed: saves.isError,
    retry: () => saves.refetch(),
    toggle: (presetId: string, saved: boolean) => set.mutate({ presetId, saved }),
  };
}

/** Save to list (ADR-042): outline when not saved, filled red when saved; the label says which. */
export function HeartButton({ saved, label, onPress }: { saved: boolean; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${saved ? "Saved" : "Save"} ${label}`}
      accessibilityState={{ selected: saved }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.sm,
        backgroundColor: c.sheet,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.rule,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <ReactionGlyph kind="heart" mine={saved} color={saved ? c.red : c["ink-2"]} />
    </Pressable>
  );
}

/** The heart for one Explore trip. */
export function SaveHeart({ presetId, title }: { presetId: string; title: string }) {
  const { ids, toggle } = useSavedTrips();
  const saved = ids.includes(presetId);
  return <HeartButton saved={saved} label={title} onPress={() => toggle(presetId, !saved)} />;
}
