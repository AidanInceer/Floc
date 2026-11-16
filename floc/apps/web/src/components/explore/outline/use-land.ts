"use client";

import { useEffect, useState } from "react";

import type { Packed } from "@/lib/land/pack-land";

import { landFrom, landFromPacked, type Geo, type Piece } from "./land";

export type Detail = "world" | "fine";

const NONE: readonly Piece[] = [];
const SOURCES = {
  world: { url: "/countries-110m.geojson", read: (body: unknown) => landFrom(body as Geo) },
  fine: { url: "/land-50m.json", read: (body: unknown) => landFromPacked(body as Packed) },
};
const loaded: Partial<Record<Detail, readonly Piece[]>> = {};
const pending: Partial<Record<Detail, Promise<readonly Piece[]>>> = {};

export function loadLand(detail: Detail): Promise<readonly Piece[]> {
  const { url, read } = SOURCES[detail];
  pending[detail] ??= fetch(url)
    .then((res) => (res.ok ? res.json() : null))
    .then((body) => (loaded[detail] = body ? read(body) : NONE))
    .catch(() => NONE);
  return pending[detail];
}

export function useLand(detail: Detail): readonly Piece[] {
  const [land, setLand] = useState(loaded[detail] ?? NONE);
  useEffect(() => {
    if (loaded[detail]) return;
    let live = true;
    void loadLand(detail).then((pieces) => {
      if (live) setLand(pieces);
    });
    return () => {
      live = false;
    };
  }, [detail]);
  return land;
}
