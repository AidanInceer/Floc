import type { MediaGroup } from "@floc/core/media/media";

import { cx } from "@/components/system/ui";
import { StopNo } from "../stops/stop-parts";

export const PHOTOS_SHOWN = 4;
export const PHOTOS_CARD_CLASS = "rounded-md border border-rule-strong bg-sheet px-[18px] pt-4";
export const PHOTOS_HEAD_CLASS = "mb-2.5 flex min-h-[26px] items-center gap-2";
export const PHOTOS_GROUP_HEAD_CLASS = "mb-1.5 flex items-center gap-2.5";
export const PHOTOS_TILES_CLASS = "grid grid-cols-4 gap-1";

export const photosGroupClass = (key: string) =>
  cx("border-t border-rule pb-2.5 pt-2", key === "trip" && "-mx-[18px] rounded-b-md bg-sheet-2 px-[18px] pb-3.5");

export function PhotosPlaceholder({ groups }: { groups: MediaGroup<unknown>[] }) {
  return (
    <section aria-busy="true" aria-label="Photos and videos" className={PHOTOS_CARD_CLASS}>
      <header className={PHOTOS_HEAD_CLASS}>
        <h3 className="typed">Photos</h3>
      </header>
      <ul>
        {groups.map((g) => (
          <li key={g.key} className={photosGroupClass(g.key)}>
            <div className={PHOTOS_GROUP_HEAD_CLASS}>
              <span className="inline-flex h-[26px] min-w-0 flex-1 items-center gap-2.5">
                {g.no ? <StopNo no={g.no} small /> : null}
                <span className="truncate font-medium">{g.name}</span>
              </span>
            </div>
            {g.items.length > 0 ? (
              <div aria-hidden className={PHOTOS_TILES_CLASS}>
                <div className="aspect-square w-full rounded-sm bg-sheet-3 opacity-70" />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
