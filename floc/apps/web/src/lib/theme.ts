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
  }
}

export function applyTheme(
  root: { dataset: DOMStringMap },
  choice: ThemeChoice,
  prefersDark: boolean,
  nextFrame: (run: () => void) => void = requestAnimationFrame,
) {
  root.dataset.themeSwap = "";
  root.dataset.themeChoice = choice;
  root.dataset.theme = resolveTheme(choice, prefersDark);
  nextFrame(() => nextFrame(() => delete root.dataset.themeSwap));
}

export function themeBootstrap(signedIn: boolean): string {
  const read = signedIn ? `localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})` : JSON.stringify("light");
  return `(function(){var r=document.documentElement;try{var c=${read};if(c!=="light"&&c!=="dark"){c="system"}r.dataset.themeChoice=c;r.dataset.theme=c==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):c}catch(e){r.dataset.themeChoice="system";r.dataset.theme="light"}})()`;
}
