/**
 * Which theme is on, and where the choice is kept (ticket 240).
 *
 * The browser's own setting is the default; an explicit choice wins and
 * persists. There is no `theme` column — the choice belongs to the device, not
 * the account, and a server round-trip would put a light flash back.
 */
export const THEMES = ["light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "floc-theme";

/** A stored or already-applied value, or `light` when it is neither. */
export function readStoredTheme(value: string | undefined | null): Theme {
  return value === "dark" ? "dark" : "light";
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be denied outright (private mode, blocked cookies). The
    // theme still applies for this page; it just won't survive a reload.
  }
}

/**
 * Run on `<html>` before the first paint, so a dark reload never flashes
 * light. Inlined as a string because it has to execute ahead of any bundle.
 */
export const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})()`;
