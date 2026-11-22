"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { fillRows } from "@floc/core/media/media";

import { Dialog } from "@/components/system/dialog";
import { CrossIcon, UploadIcon } from "@/components/system/icons";
import { ErrorText, buttonClass, cx, iconButtonClass } from "@/components/system/ui";
import type { MediaItem, MediaView } from "@/server/media/media-view";
import { MediaTile } from "./media-tile";
import type { MediaUpload } from "./use-media-upload";
import { MediaViewer, type ViewerEntry } from "./media-viewer";

const NARROW = "(max-width: 640px)";
const watchNarrow = (notify: () => void) => {
  const query = matchMedia(NARROW);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

function Tessellated({ items, onOpen }: { items: MediaItem[]; onOpen: (id: number) => void }) {
  const narrow = useSyncExternalStore(watchNarrow, () => matchMedia(NARROW).matches, () => false);
  return (
    <div className="flex flex-col gap-1">
      {fillRows(items, narrow ? 2.4 : 4.6).map((row) => (
        <div key={row[0].id} className="flex gap-1">
          {row.map((item) => (
            <MediaTile key={item.id} item={item} style={{ flex: `${item.ratio} 1 0`, aspectRatio: item.ratio }} onOpen={() => onOpen(item.id)} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MediaGallery({ tripId, view, start, upload, onClose }: {
  tripId: number;
  view: MediaView;
  start: string;
  upload: MediaUpload;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(start);
  const [viewing, setViewing] = useState<number | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const entries = useMemo<ViewerEntry[]>(
    () => view.groups.flatMap((g) => g.items.map((item) => ({ item, place: g.name }))),
    [view.groups],
  );
  const stopViewing = useCallback(() => setViewing(null), []);

  useEffect(() => {
    body.current?.querySelector(`[data-part="${start}"]`)?.scrollIntoView({ block: "start" });
  }, [start]);

  const onScroll = () => {
    const box = body.current;
    if (!box || pinned.current) return;
    const top = box.getBoundingClientRect().top;
    const parts = [...box.querySelectorAll<HTMLElement>("[data-part]")];
    const here = parts.filter((p) => p.getBoundingClientRect().top - top <= 40).pop() ?? parts[0];
    if (here?.dataset.part) setCurrent(here.dataset.part);
  };

  const jump = (key: string) => {
    pinned.current = true;
    setCurrent(key);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    body.current?.querySelector(`[data-part="${key}"]`)?.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" });
  };

  const group = view.groups.find((g) => g.key === current);

  return (
    <Dialog
      open
      title="Photos and videos"
      onClose={viewing !== null ? stopViewing : onClose}
      className="m-auto h-[min(44rem,calc(100dvh-2rem))] w-[min(62rem,calc(100vw-2rem))] max-w-none flex-col gap-3 overflow-hidden rounded-md bg-sheet p-2.5 text-ink shadow-lifted backdrop:bg-black/70 open:flex max-sm:mb-0 max-sm:h-[92dvh] max-sm:w-full max-sm:rounded-b-none sm:p-3.5"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-rule pb-3">
        <div role="group" aria-label="Stop" className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
          {view.groups.map((g) => (
            <button
              key={g.key}
              type="button"
              aria-pressed={g.key === current}
              onClick={() => jump(g.key)}
              className={cx(
                "inline-flex h-[31px] shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-sm transition-colors",
                g.key === current ? "bg-pen-soft text-pen-deep" : "text-ink-2 hover:text-pen-deep",
              )}
            >
              {g.no ? <span className="nums text-xs font-medium">{g.no}</span> : null}
              {g.name}
              <span className={cx("nums text-xs", g.key !== current && "text-ink-faint")}>{g.items.length}</span>
            </button>
          ))}
        </div>
        <span className="nums shrink-0 text-xs text-ink-faint max-sm:hidden">{view.capLine}</span>
        {view.canAdd ? (
          <button type="button" disabled={upload.busy} onClick={() => upload.pick(group?.placeId ?? null)} aria-label="Add photos or videos" className={cx(buttonClass("secondary"), "max-sm:h-[31px] max-sm:w-[31px] max-sm:px-0")}>
            <UploadIcon />
            <span className="max-sm:hidden">Add</span>
          </button>
        ) : null}
        <button type="button" aria-label="Close" title="Close" onClick={onClose} className={iconButtonClass(false)}>
          <CrossIcon />
        </button>
      </header>
      {upload.line || upload.error ? (
        <div className="shrink-0 text-xs text-ink-2">
          {upload.line}
          <ErrorText>{upload.error}</ErrorText>
        </div>
      ) : null}
      <div
        ref={body}
        onScroll={onScroll}
        onWheel={() => { pinned.current = false; }}
        onTouchMove={() => { pinned.current = false; }}
        onPointerDown={() => { pinned.current = false; }}
        onKeyDown={() => { pinned.current = false; }}
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-0.5"
      >
        {view.groups.map((g) => (
          <section key={g.key} data-part={g.key}>
            <h3 className="sticky -top-0.5 z-[2] flex items-center gap-1.5 bg-sheet pb-2 pt-1 font-display text-lg">
              {g.no ? <span className="nums text-sm text-pen">{g.no}</span> : null}
              {g.name}
              <span className="nums ml-1 text-xs font-normal text-ink-faint">{g.items.length}</span>
            </h3>
            {g.items.length > 0 ? <Tessellated items={g.items} onOpen={setViewing} /> : (
              <p className="py-6 text-sm text-ink-faint">Nothing here yet</p>
            )}
          </section>
        ))}
      </div>
      {viewing !== null ? (
        <MediaViewer tripId={tripId} entries={entries} startId={viewing} canEdit={view.canAdd} onClose={stopViewing} />
      ) : null}
    </Dialog>
  );
}
