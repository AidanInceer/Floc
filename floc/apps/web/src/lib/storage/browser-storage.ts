/** Why: a browser can refuse storage outright (private mode, blocked cookies); a preference must never throw (#572). */
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The choice still holds for this page; it will not survive a reload.
  }
}
