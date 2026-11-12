"use client";

import { useEffect, useState } from "react";

import { Button, Segmented, buttonClass, segmentClass } from "@/components/system/ui";
import { ShareIcon } from "@/components/system/icons";

type Status = "idle" | "copied" | "failed";
type Look = "light" | "dark";

// Why: the picture starts in the theme the page is in (#443); the person can send the other.
const pageLook = (): Look => (typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light");

/** The trip as a picture, never a link (ADR-045): the device's share sheet where it can take a file, else copy and download. */
export function SharePicture({ tripId, tripName }: { tripId: number; tripName: string }) {
  const [look, setLook] = useState<Look>(pageLook);
  const src = `/trip/${tripId}/recap-card?theme=${look}`;
  const fileName = `${tripName.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase() || "trip"}-floc.png`;
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    fetch(src)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => live && setFile(new File([blob], fileName, { type: "image/png" })))
      .catch(() => live && setStatus("failed"));
    return () => { live = false; };
  }, [src, fileName, attempt]);

  const canShare = file !== null && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] }) === true;

  async function copy() {
    if (!file) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": file })]);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Segmented>
        {(["light", "dark"] as const).map((l) => (
          <button key={l} type="button" aria-pressed={look === l} onClick={() => { setFile(null); setStatus("idle"); setLook(l); }} className={segmentClass(look === l)}>
            {l === "light" ? "Light" : "Dark"}
          </button>
        ))}
      </Segmented>
      {/* eslint-disable-next-line @next/next/no-img-element -- Why: a member-only picture made per request; next/image would cache it on a shared path. */}
      <img src={src} alt={`${tripName}: the route, its places and nights`} width={1080} height={1350} className="h-auto w-full max-w-[18rem] rounded-md shadow-raised ring-1 ring-rule" />
      <div className="flex flex-wrap justify-center gap-2">
        {status === "failed" && !file ? (
          <Button onClick={() => { setStatus("idle"); setAttempt((n) => n + 1); }}>Try again</Button>
        ) : canShare ? (
          <Button variant="primary" onClick={() => void navigator.share({ files: [file!] }).catch(() => undefined)}>
            <ShareIcon size={12} />Share
          </Button>
        ) : (
          <>
            <Button onClick={() => void copy()} disabled={!file}>Copy image</Button>
            <a href={src} download={fileName} className={buttonClass("primary")}>
              Download
            </a>
          </>
        )}
      </div>
      <p role="status" className="min-h-5 text-xs text-ink-soft">
        {status === "copied" ? "Copied" : status === "failed" ? (file ? "The picture could not be copied. Use Download." : "The picture could not be made.") : null}
      </p>
    </div>
  );
}
