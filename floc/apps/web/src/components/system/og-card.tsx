/**
 * The link-preview cards a shared link unfurls to: the wordmark as `wordmark.tsx` draws it, in the
 * light tokens, because the image renderer cannot read CSS variables. No custom font is loaded, so
 * a card always renders (rule 11).
 */
import { resolveColours } from "@floc/core/design/tokens";

const colours = resolveColours("light");

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_COLOURS = {
  ground: colours.paper,
  ink: colours.ink,
  inkSoft: colours["ink-2"],
  pen: colours.pen,
  butter: colours["pastel-yellow"],
};

export function OgWordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: 38, fontWeight: 700, color: OG_COLOURS.ink }}>
      <svg
        width={62}
        height={49}
        viewBox="0 0 28 22"
        fill="none"
        stroke={OG_COLOURS.pen}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: 12 }}
      >
        <path d="M3.4 16.5 7 12.9 10.6 16.5" />
        <path d="M10.4 10 14 6.4 17.6 10" />
        <path d="M17.4 16.5 21 12.9 24.6 16.5" />
      </svg>
      floc<span style={{ color: OG_COLOURS.pen }}>.</span>
    </div>
  );
}

/** A public page's card: the wordmark, the page's heading large, one line under it. */
export function OgPageCard({ heading, line }: { heading: string; line: string }) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: OG_COLOURS.ground,
        padding: "72px 80px",
      }}
    >
      <OgWordmark />
      <div style={{ fontSize: 88, fontWeight: 700, color: OG_COLOURS.ink, lineHeight: 1.02, maxWidth: 1040 }}>
        {heading}
      </div>
      <div style={{ fontSize: 30, color: OG_COLOURS.inkSoft, maxWidth: 1040 }}>{line}</div>
    </div>
  );
}
