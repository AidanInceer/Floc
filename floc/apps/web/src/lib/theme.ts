/**
 * Which theme is on, and where the choice is kept (ticket 240).
 *
 * Light, dark, or auto — auto follows the browser's own setting and is what
 * nothing stored means. There is no `theme` column — the choice belongs to the
 * device, not the account, and a server round-trip would put a light flash back.
 */
export const THEME_CHOICES = ["light", "dark", "system"] as const;

export type ThemeChoice = (typeof THEME_CHOICES)[number];

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "floc-theme";

export function readStoredChoice(value: string | undefined | null): ThemeChoice {
  return value === "dark" || value === "light" ? value : "system";
}

export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): Theme {
  if (choice === "system") return prefersDark ? "dark" : "light";
  return choice;
}

export function storeChoice(choice: ThemeChoice) {
  try {
    if (choice === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Storage can be denied outright (private mode, blocked cookies). The
    // theme still applies for this page; it just won't survive a reload.
  }
}

/**
 * Why: runs before any bundle so a dark reload never flashes light, and lights
 * the switch before hydration. Signed out there is no switch, so stored is ignored.
 */
export function themeBootstrap(signedIn: boolean): string {
  const read = signedIn ? `localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})` : "null";
  return `(function(){var r=document.documentElement;try{var c=${read};if(c!=="light"&&c!=="dark"){c="system"}r.dataset.themeChoice=c;r.dataset.theme=c==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):c}catch(e){r.dataset.themeChoice="system";r.dataset.theme="light"}})()`;
}
