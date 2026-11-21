import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/lib/api";

import { useReducedMotion } from "@/components/system/use-reduced-motion";

export function useStill(): boolean | null {
  const device = useReducedMotion();
  const settings = useQuery(trpc.settings.get.queryOptions());
  return settings.data?.reduceMotion ? true : device;
}
