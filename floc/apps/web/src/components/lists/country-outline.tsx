"use client";

import { useMemo } from "react";

import { drawOutline } from "@/components/explore/outline/drawing";
import type { Piece } from "@/components/explore/outline/land";
import { useLand } from "@/components/explore/outline/use-land";

const BOX = { width: 240, height: 170 };

/** The middle of a country's largest landmass: where its outline is framed from. */
function middleOf(land: readonly Piece[], code: string) {
  const piece = land
    .filter((p) => p.code === code)
    .sort((a, b) => (b.box.east - b.box.west) * (b.box.north - b.box.south) - (a.box.east - a.box.west) * (a.box.north - a.box.south))[0];
  return piece ? { lng: (piece.box.west + piece.box.east) / 2, lat: (piece.box.south + piece.box.north) / 2 } : null;
}

/** One country's outline at tile size, in a listing tile's style, with no route (#467). */
export function CountryOutline({ code, name, fill }: { code: string; name: string; fill: string }) {
  const land = useLand("fine");
  const d = useMemo(() => {
    const middle = middleOf(land, code);
    return middle ? drawOutline([middle], new Set([code]), land, BOX) : null;
  }, [land, code]);

  return (
    <svg viewBox={`0 0 ${BOX.width} ${BOX.height}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={name} className="block size-full">
      {d ? (
        <>
          <path d={d.home} className={fill} />
          <path d={d.other} strokeWidth={0.75} className="fill-sheet-3 stroke-rule-strong" />
        </>
      ) : null}
    </svg>
  );
}
