// The horizon ribbon — the app's signature element.
//
// The whole forecast as one continuous ruled strip rather than a chart in a
// box: every month is a column of the register, the buffer floor is a single
// line crossing the full width, and the tightest month is the only thing on the
// page permitted to carry brick red.
//
// Hand-rolled SVG. A chart library would bring its own visual language, and the
// point of this element is that it shares the ledger's. Every colour comes from
// a class in styles.css rather than a presentation attribute, so the design
// tokens stay in one place.

import type { Forecast } from "../domain/forecast";
import { gbp } from "../domain/money";

const W = 960;
const PAD_T = 30;
const PAD_B = 26;

export function HorizonRibbon({
  forecast,
  bufferFloor,
  compact = false,
}: {
  forecast: Forecast;
  bufferFloor: number;
  compact?: boolean;
}) {
  const rows = forecast.rows;
  const h = compact ? 180 : 250;
  const innerH = h - PAD_T - PAD_B;

  const values = rows.map((r) => r.spendingClosing);
  const top = Math.max(...values, bufferFloor) * 1.12;
  const bottom = Math.min(0, ...values);
  const span = top - bottom || 1;

  const band = W / rows.length;
  const cx = (i: number) => band * i + band / 2;
  const y = (v: number) => PAD_T + innerH - (innerH * (v - bottom)) / span;

  const line = rows.map((r, i) => `${cx(i)},${y(r.spendingClosing)}`).join(" ");
  const area = `0,${y(bottom)} ${cx(0)},${y(values[0])} ${line} ${cx(rows.length - 1)},${y(bottom)} ${W},${y(bottom)}`;

  const troughIdx = forecast.trough.i - 1;
  const breached = forecast.trough.amount < bufferFloor;

  // Three reference levels, labelled inside the strip's own left margin.
  const levels = [0, 0.5, 1].map((f) => bottom + span * f);

  return (
    <div className="ribbon">
      <svg
        className="ribbon-svg"
        viewBox={`0 0 ${W} ${h}`}
        role="img"
        aria-label={`Spending cash across ${rows.length} months. Lowest point ${gbp(forecast.trough.amount)} in ${forecast.trough.label}.`}
      >
        {/* the tightest month, called out as a tinted column */}
        <rect
          className={`rib-trough ${breached ? "is-breach" : ""}`}
          x={band * troughIdx}
          y={PAD_T}
          width={band}
          height={innerH}
        />

        {levels.map((v, i) => (
          <g key={`lvl-${i}`}>
            <line className="rib-rule" x1={0} x2={W} y1={y(v)} y2={y(v)} />
            <text className="rib-level" x={2} y={y(v) - 5}>
              {gbp(v)}
            </text>
          </g>
        ))}

        {rows.map((_, i) => (
          <line
            className="rib-rule"
            key={`col-${i}`}
            x1={band * i}
            x2={band * i}
            y1={PAD_T}
            y2={h - PAD_B}
          />
        ))}

        <polygon className="rib-area" points={area} />

        {/* the buffer floor, crossing everything */}
        <line className="rib-floor" x1={0} x2={W} y1={y(bufferFloor)} y2={y(bufferFloor)} />
        <text className="rib-floor-label" x={W - 2} y={y(bufferFloor) - 6}>
          floor {gbp(bufferFloor)}
        </text>

        <polyline className="rib-line ribbon-draw" points={line} pathLength={1} />

        {rows.map((r, i) => (
          <circle
            key={`pt-${i}`}
            className={`rib-dot ${i === troughIdx ? "is-low" : ""}`}
            cx={cx(i)}
            cy={y(r.spendingClosing)}
            r={i === troughIdx ? 3.6 : 2}
          />
        ))}

        <text className="rib-callout" x={cx(troughIdx)} y={y(forecast.trough.amount) - 11}>
          {gbp(forecast.trough.amount)}
        </text>

        <line className="rib-base" x1={0} x2={W} y1={h - PAD_B} y2={h - PAD_B} />

        {rows.map((r, i) => (
          <text
            key={`m-${i}`}
            className={`rib-month ${i === troughIdx ? "is-low" : ""}`}
            x={cx(i)}
            y={h - 9}
          >
            {r.label.replace(/-\d+$/, "")}
          </text>
        ))}
      </svg>

      <div className="ribbon-key">
        <span>
          <i style={{ background: "var(--indigo)" }} /> Spending cash, closing
        </span>
        <span>
          <i style={{ background: "var(--risk)" }} /> Buffer floor
        </span>
        <span>
          Tightest month&nbsp;<strong>{forecast.trough.label}</strong>
        </span>
      </div>
    </div>
  );
}
