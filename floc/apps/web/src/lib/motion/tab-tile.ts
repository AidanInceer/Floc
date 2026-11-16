type ClickLike = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

export function isPlainClick(e: ClickLike): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented;
}

export function tileHref(current: string | null, pressed: string | null): string | null {
  return pressed ?? current;
}
