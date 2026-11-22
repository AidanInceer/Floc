"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type ChangeEvent } from "react";

import { VIDEO_LOCATION_NOTE, mediaType, refuseType } from "@floc/core/media/media";

import { mediaUploadToken } from "@/app/trip/[id]/overview/media/actions";

type VideoShape = { w: number; h: number; d: number };

function readVideoShape(file: File): Promise<VideoShape | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const done = (shape: VideoShape | null) => {
      URL.revokeObjectURL(url);
      resolve(shape);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => done({ w: video.videoWidth, h: video.videoHeight, d: Math.round(video.duration) || 0 });
    video.onerror = () => done(null);
    video.src = url;
  });
}

async function send(tripId: number, placeId: number | null, file: File): Promise<string | null> {
  const type = mediaType(file.type);
  if (!type) return refuseType(file.type);
  const shape = type.kind === "video" ? await readVideoShape(file) : null;
  const query = new URLSearchParams();
  if (placeId !== null) query.set("place", String(placeId));
  if (shape) {
    query.set("w", String(shape.w));
    query.set("h", String(shape.h));
    query.set("d", String(shape.d));
  }
  const token = await mediaUploadToken(tripId);
  const response = await fetch(`/api/media/${tripId}?${query}`, {
    method: "POST",
    headers: { "Content-Type": type.mimeType, "x-floc-media-token": token },
    body: file,
  });
  if (response.ok) return null;
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "That file could not be added.";
}

export type MediaUpload = {
  pick: (placeId: number | null) => void;
  onFiles: (event: ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  busy: boolean;
  line: string | null;
  error: string | null;
};

export function useMediaUpload(tripId: number): MediaUpload {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const target = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = useCallback((placeId: number | null) => {
    target.current = placeId;
    inputRef.current?.click();
  }, []);

  const onFiles = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0) return;
    const hasVideo = files.some((file) => file.type.startsWith("video/"));
    setBusy(true);
    setError(null);
    let failed: string | null = null;
    for (const [i, file] of files.entries()) {
      setLine(`Adding ${i + 1} of ${files.length}`);
      failed = (await send(tripId, target.current, file).catch(() => "That file could not be added.")) ?? failed;
    }
    setBusy(false);
    setLine(hasVideo ? VIDEO_LOCATION_NOTE : null);
    setError(failed);
    router.refresh();
  }, [router, tripId]);

  return { pick, onFiles, inputRef, busy, line, error };
}
