import "server-only";

const LONG_EDGE = 2048;
const THUMB_EDGE = 640;
const MAX_INPUT_PIXELS = 120_000_000;

export type CleanPhoto = { width: number; height: number; sizeBytes: number };

export async function cleanPhoto(input: string, output: string, thumb: string): Promise<CleanPhoto> {
  const { default: sharp } = await import("sharp");
  const source = () => sharp(input, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS }).rotate();
  const info = await source()
    .resize(LONG_EDGE, LONG_EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(output);
  await source()
    .resize(THUMB_EDGE, THUMB_EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 74 })
    .toFile(thumb);
  return { width: info.width, height: info.height, sizeBytes: info.size };
}
