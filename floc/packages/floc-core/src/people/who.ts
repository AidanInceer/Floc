const WHO_TONES = 8;

export type WhoTone = `who-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

export function whoTone(name: string): WhoTone {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return `who-${(Math.abs(hash) % WHO_TONES) + 1}` as WhoTone;
}
