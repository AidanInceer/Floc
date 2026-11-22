"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { deleteMedia } from "@/app/trip/[id]/overview/media/actions";
import { ConfirmSubmit } from "@/components/system/client-ui";
import { ChevronIcon, CrossIcon } from "@/components/system/icons";
import { BinIcon } from "@/components/system/icons/media";
import { Avatar, ErrorText, iconButtonClass } from "@/components/system/ui";
import type { MediaItem } from "@/server/media/media-view";

export type ViewerEntry = { item: MediaItem; place: string };

export function MediaViewer({ tripId, entries, startId, canEdit, onClose }: {
  tripId: number;
  entries: ViewerEntry[];
  startId: number;
  canEdit: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [id, setId] = useState(startId);
  const [problem, setProblem] = useState<string | null>(null);
  const at = entries.findIndex((e) => e.item.id === id);
  const index = Math.max(at, 0);
  const entry = entries[index];
  const count = entries.length;

  useEffect(() => {
    if (count === 0) onClose();
  }, [count, onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.target instanceof HTMLVideoElement || count < 2) return;
      if (document.querySelectorAll("dialog[open]").length > 1) return;
      const by = event.key === "ArrowLeft" ? -1 : 1;
      setProblem(null);
      setId(entries[(index + by + count) % count].item.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, entries, index]);

  if (!entry) return null;
  const { item, place } = entry;
  const step = (by: number) => {
    setProblem(null);
    setId(entries[(index + by + count) % count].item.id);
  };
  const remove = async () => {
    setProblem(null);
    const next = entries[index + 1] ?? entries[index - 1];
    try {
      await deleteMedia(tripId, item.id);
    } catch {
      setProblem("That could not be deleted.");
      return;
    }
    if (next) setId(next.item.id);
    else onClose();
    router.refresh();
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-sheet p-2.5 sm:p-3.5">
      <div className="mb-3 flex min-h-11 shrink-0 items-center gap-3 border-b border-rule pb-3 text-sm">
        {count > 1 ? (
          <span className="flex items-center gap-1.5">
            <button type="button" aria-label="Previous" title="Previous" onClick={() => step(-1)} className={iconButtonClass(false)}>
              <ChevronIcon direction="left" />
            </button>
            <span className="nums text-xs text-ink-2">{index + 1}/{count}</span>
            <button type="button" aria-label="Next" title="Next" onClick={() => step(1)} className={iconButtonClass(false)}>
              <ChevronIcon direction="right" />
            </button>
          </span>
        ) : null}
        <span className="flex min-w-0 items-center gap-1.5">
          <Avatar name={item.who} size={22} tone={item.tone} />
          <span className="truncate">{item.who}</span>
          <span className="truncate text-ink-faint">{place}</span>
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          {item.mine && canEdit ? (
            <form action={remove}>
              <ConfirmSubmit
                label="Delete"
                message={item.kind === "video" ? "Delete this video?" : "Delete this photo?"}
                detail="It goes for everyone on the trip."
                confirmLabel="Delete"
                className={iconButtonClass(false)}
              >
                <BinIcon />
              </ConfirmSubmit>
            </form>
          ) : null}
          <button type="button" aria-label="Close" title="Close" onClick={onClose} className={iconButtonClass(false)}>
            <CrossIcon />
          </button>
        </span>
      </div>
      {problem ? <div className="mb-2 shrink-0"><ErrorText>{problem}</ErrorText></div> : null}
      <figure className="m-0 min-h-0 flex-1 overflow-hidden rounded-sm bg-sheet-2">
        {item.kind === "video" ? (
          <video key={item.id} src={item.src} controls playsInline preload="metadata" className="h-full w-full object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={item.id} src={item.src} alt={`Photo from ${item.who}, ${place}`} className="h-full w-full object-contain" />
        )}
      </figure>
    </div>
  );
}
