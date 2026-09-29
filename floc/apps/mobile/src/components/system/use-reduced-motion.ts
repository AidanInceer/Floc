import { useEffect, useState } from "react";

import { observeReducedMotion } from "@/lib/accessibility/reduced-motion";

export function useReducedMotion(): boolean | null {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => observeReducedMotion(setReduced), []);
  return reduced;
}
