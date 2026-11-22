import type { Fits } from "@floc/core/trip/explore/fit/listing-fit";
import { NO_MATCH_LINE } from "@floc/core/trip/explore/fit/match-words";
import { useRouter } from "expo-router";

import { TextLink } from "../system/text-controls";

export function MatchHint({ fit, ready }: { fit: Fits | null; ready: boolean }) {
  const router = useRouter();
  if (!ready || fit) return null;
  return <TextLink label={NO_MATCH_LINE} onPress={() => router.push("/settings")} />;
}
