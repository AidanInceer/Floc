import type { CSSProperties } from "react";

import type { MediaItem } from "@/server/media/media-view";

const FILL = "absolute inset-0 h-full w-full object-contain";

export function MediaViewerPicture({ item, place, style, onMeasure }: {
  item: MediaItem;
  place: string;
  style: CSSProperties;
  onMeasure: (width: number, height: number) => void;
}) {
  return (
    <figure style={style} className="relative m-0 w-full shrink-0 bg-sheet-2">
      {item.kind === "video" ? (
        <video
          key={item.id}
          src={item.src}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => onMeasure(event.currentTarget.videoWidth, event.currentTarget.videoHeight)}
          className={FILL}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={item.id}
          src={item.src}
          alt={`Photo from ${item.who}, ${place}`}
          onLoad={(event) => onMeasure(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
          className={FILL}
        />
      )}
    </figure>
  );
}
