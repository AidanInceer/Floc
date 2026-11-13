/** The trip tab bar's one tile (ADR-052): it goes to the tab you press, before that page arrives. */
type ClickLike = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

/** A click that navigates this tab, not one that opens a new tab or window. */
export function isPlainClick(e: ClickLike): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented;
}

export function tileHref(current: string | null, pressed: string | null): string | null {
  return pressed ?? current;
}
