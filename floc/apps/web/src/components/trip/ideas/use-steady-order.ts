"use client";

import { useState } from "react";

import { steadyOrder } from "@floc/core/trip/ideas";

/** The list in the order it was first shown; a new `orderKey` (the reader picking a sort) orders it afresh. */
export function useSteadyOrder<T extends { id: number }>(sorted: readonly T[], orderKey = ""): T[] {
  const ids = sorted.map((i) => i.id);
  const [held, setHeld] = useState({ orderKey, ids });
  const order = steadyOrder(held.orderKey === orderKey ? held.ids : ids, ids);
  if (held.orderKey !== orderKey || order.join() !== held.ids.join()) setHeld({ orderKey, ids: order });
  const byId = new Map(sorted.map((i) => [i.id, i]));
  return order.map((id) => byId.get(id)!);
}
