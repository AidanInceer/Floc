"use client";

import { useMemo } from "react";

import { drawCountry } from "@/components/explore/outline/drawing";
import { useLand } from "@/components/explore/outline/use-land";

const BOX = { width: 240, height: 170 };

/** One country's outline at tile size, in a listing tile's style, with no route (#467). */
export function CountryOutline({ code, name, fill }: { code: string; name: string; fill: string }) {
  const land = useLand("fine");
  const d = useMemo(() => drawCountry(code, land, BOX), [land, code]);

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
