import { cx } from "@/components/system/ui";
import { Glyph } from "./landing-content";
import type { TourMessage, TourStop } from "./landing-content";

export type TourPhase = { shown: number; typing: boolean; answered: boolean };

const faces = [
  { name: "P", tone: "bg-pastel-blue text-pastel-blue-ink" },
  { name: "S", tone: "bg-pastel-green text-pastel-green-ink" },
  { name: "J", tone: "bg-pastel-red text-pastel-red-ink" },
  { name: "A", tone: "bg-pastel-yellow text-pastel-yellow-ink" },
];

export function StopIcon({ stop, small }: { stop: TourStop; small?: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-sm",
        small ? "size-7" : "size-9",
        stop.tone,
      )}
    >
      <Glyph name={stop.icon} className="size-[15px]" />
    </span>
  );
}

export function ProTag({ stop }: { stop: TourStop }) {
  const label = stop.pro === "soon" ? "Pro · soon" : stop.pro ? "Pro" : stop.proExtra ? "+ Pro" : null;
  if (!label) return null;
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-pro-edge bg-pro px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-pro-gold">
      {label}
    </span>
  );
}

/** The fill keeps its last frame, so a stop someone picked rests on a full line. */
export function PlayLine({ duration, still }: { duration: number; still: boolean }) {
  return (
    <span className="dash-track relative block h-[2px] w-full" aria-hidden>
      <i
        className={cx("dash-fill absolute inset-y-0 left-0", still && "w-full animate-none")}
        style={still ? undefined : { animationDuration: `${duration}ms` }}
      />
    </span>
  );
}

function Bubble({ message, faded }: { message: TourMessage; faded: boolean }) {
  return (
    <div
      className={cx(
        "rise-in w-fit max-w-[85%] border px-3 py-1.5 text-sm transition-opacity duration-500",
        message.reply
          ? "self-end rounded-[14px_14px_4px_14px] border-sheet-3 bg-sheet-3"
          : "rounded-[14px_14px_14px_4px] border-rule bg-sheet",
        faded && "opacity-80",
      )}
    >
      <small className="block font-mono text-[10px] uppercase tracking-[0.05em] text-ink-faint">
        {message.from}
        {message.when ? ` · ${message.when}` : null}
      </small>
      {message.text}
    </div>
  );
}

function Typing() {
  return (
    <div className="flex w-fit gap-1 rounded-[14px] border border-rule bg-sheet px-3 py-2.5" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <i key={delay} className="typing-dot size-[5px] rounded-full bg-ink-faint" style={{ animationDelay: `${delay}ms` }} />
      ))}
    </div>
  );
}

function Pinned({ stop }: { stop: TourStop }) {
  const pro = Boolean(stop.pro);
  return (
    <div
      className={cx(
        "rise-in mt-2 grid grid-cols-[1.75rem_1fr] gap-2.5 rounded-md border p-3 shadow-raised sm:grid-cols-[2.25rem_1fr] sm:gap-3 sm:px-4 sm:py-3.5",
        pro ? "border-pro-edge bg-pro text-pro-ink" : "border-rule bg-sheet",
      )}
    >
      <StopIcon stop={stop} small />
      <div>
        <p className="typed flex items-center gap-2">
          Pinned by Floc {pro ? <ProTag stop={stop} /> : null}
        </p>
        <h3 className="mt-0.5 text-md sm:text-lg">{stop.answer}</h3>
        <p className={cx("text-sm", pro ? "text-pro-ink-soft" : "text-ink-soft")}>{stop.detail}</p>
      </div>
      {stop.proExtra ? (
        <p className="col-span-2 mt-1 flex items-center gap-2 border-t border-dashed border-pro-edge pt-2.5 text-sm text-pro-ink-soft">
          <Glyph name="star" className="size-[13px] shrink-0 text-pro-gold" />
          {stop.proExtra}
        </p>
      ) : null}
    </div>
  );
}

export function TourChat({ stop, phase }: { stop: TourStop; phase: TourPhase }) {
  return (
    <div className="flex h-[25rem] flex-col overflow-hidden rounded-lg border border-rule bg-sheet md:h-[29rem]">
      <div className="flex items-center gap-3 border-b border-rule px-4 py-3.5 sm:px-5">
        <div className="flex" aria-hidden>
          {faces.map((f, i) => (
            <span
              key={f.name}
              className={cx("grid size-[26px] place-items-center rounded-full border-2 border-sheet text-[11px] font-semibold", f.tone, i > 0 && "-ml-2")}
            >
              {f.name}
            </span>
          ))}
        </div>
        <b className="text-sm font-semibold">Sicily 2027</b>
        <span className="typed ml-auto">6 people</span>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-1.5 overflow-hidden bg-sheet-2 p-3.5 sm:p-[18px]" aria-live="polite">
        {stop.chat.slice(0, phase.shown).map((m) => (
          <Bubble key={`${stop.title}-${m.from}-${m.text}`} message={m} faded={phase.answered} />
        ))}
        {phase.typing ? <Typing /> : null}
        {phase.answered ? <Pinned stop={stop} /> : null}
      </div>
    </div>
  );
}
