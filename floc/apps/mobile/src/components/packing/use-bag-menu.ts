import { bagMenu, type BagAction, type BagLine } from "@floc/core/packing/packing-bag";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";

import { trpc } from "@/lib/api";

import type { SectionMenuItem } from "./packing-section";

type BagBoard = { mine: BagLine[]; ideaCount: number; ideasShown: boolean };

const sayFailed = () => Alert.alert("That didn't save. Try it again.");

export function useBagMenu(
  tripId: number,
  board: BagBoard | undefined,
  onDone: () => void,
): SectionMenuItem[] {
  const lines = board?.mine ?? [];
  const suggestions = { available: (board?.ideaCount ?? 0) > 0, shown: board?.ideasShown ?? false };
  const settled = { onSuccess: onDone, onError: sayFailed };
  const setShown = useMutation({ ...trpc.packing.setIdeasShown.mutationOptions(), ...settled });
  const unpack = useMutation({ ...trpc.packing.unpackBag.mutationOptions(), ...settled });
  const dropSuggested = useMutation({ ...trpc.packing.removeSuggested.mutationOptions(), ...settled });
  const dropUnpacked = useMutation({ ...trpc.packing.removeUnpacked.mutationOptions(), ...settled });
  const empty = useMutation({ ...trpc.packing.reset.mutationOptions(), ...settled });

  const run: Record<BagAction, () => void> = {
    suggestions: () => setShown.mutate({ tripId, shown: !suggestions.shown }),
    unpack: () => unpack.mutate({ tripId }),
    removeSuggested: () => dropSuggested.mutate({ tripId }),
    removeUnpacked: () => dropUnpacked.mutate({ tripId }),
    empty: () => empty.mutate({ tripId, mine: true }),
  };

  return bagMenu(lines, suggestions).map((item) => ({
    label: item.count === null ? item.label : `${item.label} (${item.count})`,
    danger: item.danger,
    onPress: () => {
      if (!item.confirm) return run[item.action]();
      Alert.alert(item.confirm.message, item.confirm.detail, [
        { text: "Keep it", style: "cancel" },
        {
          text: item.confirm.confirmLabel,
          style: item.action === "unpack" ? "default" : "destructive",
          onPress: run[item.action],
        },
      ]);
    },
  }));
}
