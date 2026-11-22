import type { CSSProperties } from "react";

import type { MediaItem } from "@/server/media/media-view";
import { PlayIcon } from "@/components/system/icons/media";
import { cx } from "@/components/system/ui";

function MediaPicture({ item }: { item: MediaItem }) {
  if (item.kind === "video") {
    return <video src={item.thumb} preload="metadata" muted playsInline tabIndex={-1} className="block h-full w-full object-cover" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.thumb} alt="" loading="lazy" decoding="async" className="block h-full w-full object-cover" />
  );
}

export function MediaTile({ item, more = 0, compact, style, className, onOpen }: {
  item: MediaItem;
  more?: number;
  compact?: boolean;
  style?: CSSProperties;
  className?: string;
  onOpen: () => void;
}) {
  const label = `${item.kind === "video" ? "Play video" : "Open photo"} from ${item.who}`;
  return (
    <button
      type="button"
      onClick={onOpen}
      style={style}
      aria-label={more > 0 ? `${label}, and ${more} more` : label}
      className={cx("lift relative block min-w-0 overflow-hidden rounded-sm bg-sheet-3", className)}
    >
      <MediaPicture item={item} />
      {item.kind === "video" && more === 0 ? (
        <span className="nums absolute bottom-1 left-1 inline-flex h-[18px] items-center gap-1 rounded-full bg-sheet px-1.5 text-xs text-ink">
          <PlayIcon size={9} />
          {compact ? null : item.clock}
        </span>
      ) : null}
      {more > 0 ? (
        <span className="nums absolute inset-0 grid place-items-center bg-sheet/75 text-base text-ink">+{more}</span>
      ) : null}
    </button>
  );
}
