"use client";

import { useState } from "react";

import { MEDIA_ACCEPT } from "@floc/core/media/media";

import { UploadIcon } from "@/components/system/icons";
import { cx, ErrorText, iconFrameClass } from "@/components/system/ui";
import type { MediaView } from "@/server/media/media-view";
import { StopNo } from "../stops/stop-parts";
import { MediaGallery } from "./media-gallery";
import { MediaTile } from "./media-tile";
import { useMediaUpload } from "./use-media-upload";

const SHOWN = 4;

const summary = (view: MediaView) => {
  const items = view.groups.flatMap((g) => g.items);
  const videos = items.filter((m) => m.kind === "video").length;
  const photos = items.length - videos;
  return [photos ? `${photos} photo${photos === 1 ? "" : "s"}` : "", videos ? `${videos} video${videos === 1 ? "" : "s"}` : ""].filter(Boolean).join(", ");
};

export function PhotosCard({ tripId, view }: { tripId: number; view: MediaView }) {
  const [open, setOpen] = useState<string | null>(null);
  const upload = useMediaUpload(tripId);

  return (
    <section aria-label="Photos and videos" className="rounded-md border border-rule-strong bg-sheet px-[18px] pt-4">
      <input ref={upload.inputRef} type="file" accept={MEDIA_ACCEPT} multiple hidden onChange={upload.onFiles} aria-label="Choose photos or videos" />
      <header className="mb-2.5 flex min-h-[26px] items-center gap-2">
        <h3 className="typed">Photos</h3>
        <span className="nums min-w-0 flex-1 truncate text-xs text-ink-faint">{summary(view)}</span>
      </header>
      {upload.line || upload.error ? (
        <div className="mb-2 text-xs text-ink-2">
          {upload.line}
          <ErrorText>{upload.error}</ErrorText>
        </div>
      ) : null}
      <ul>
        {view.groups.map((g) => {
          const hidden = g.items.length - SHOWN;
          return (
            <li
              key={g.key}
              className={cx(
                "border-t border-rule pb-2.5 pt-2",
                g.key === "trip" && "-mx-[18px] rounded-b-md bg-sheet-2 px-[18px] pb-3.5",
              )}
            >
              <div className="mb-1.5 flex items-center gap-2.5">
                <button type="button" onClick={() => setOpen(g.key)} className="inline-flex h-[26px] min-w-0 flex-1 items-center gap-2.5 text-left transition-colors hover:text-pen-deep">
                  {g.no ? <StopNo no={g.no} small /> : null}
                  <span className="truncate font-medium">{g.name}</span>
                  <span className="nums text-xs text-ink-faint">{g.items.length}</span>
                </button>
                {view.canAdd ? (
                  <button type="button" disabled={upload.busy} onClick={() => upload.pick(g.placeId)} aria-label={`Add to ${g.name}`} title={`Add to ${g.name}`} className={iconFrameClass("row")}>
                    <UploadIcon size={12} />
                  </button>
                ) : null}
              </div>
              {g.items.length > 0 ? (
                <div className="grid grid-cols-4 gap-1">
                  {g.items.slice(0, SHOWN).map((item, i) => (
                    <MediaTile key={item.id} item={item} compact className="aspect-square w-full" more={i === SHOWN - 1 ? Math.max(hidden, 0) : 0} onOpen={() => setOpen(g.key)} />
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {open !== null ? <MediaGallery tripId={tripId} view={view} start={open} upload={upload} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}
