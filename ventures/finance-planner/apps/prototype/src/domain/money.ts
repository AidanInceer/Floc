// Money formatting helpers (prototype uses plain numbers — see types.ts note).
//
// The persistence layer does not: every amount is stored as an integer number
// of pence. `toMinor`/`fromMinor` are the only sanctioned crossing points, and
// the repository layer is the only caller.

/** Pounds → integer pence. Rounds half away from zero. */
export const toMinor = (pounds: number): number =>
  Number.isFinite(pounds) ? Math.round(pounds * 100) : 0;

/** Integer pence → pounds. */
export const fromMinor = (pence: number): number => Number(pence) / 100;


const gbp0 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const gbp2 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const gbp = (n: number) => gbp0.format(n);
export const gbpDetailed = (n: number) => gbp2.format(n);

export const signed = (n: number) =>
  (n >= 0 ? "+" : "−") + gbp0.format(Math.abs(n));

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Month labels like "Aug-26" for a horizon starting at (startMonth, startYear). */
export function monthLabels(startMonth: number, startYear: number, horizon: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < horizon; i++) {
    const m = (startMonth + i) % 12;
    const y = startYear + Math.floor((startMonth + i) / 12);
    out.push(`${MONTHS[m]}-${String(y).slice(2)}`);
  }
  return out;
}
