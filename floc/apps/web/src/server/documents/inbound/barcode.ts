/**
 * The text of the barcodes on a boarding pass file (#559): a PNG or JPEG, or the pictures inside a PDF.
 *
 * Why the limits: the file is from a forwarded mail. Only a few pages and pictures are looked at, nothing runs
 * for longer than the time limit, and any failure reads as no barcode. The decoder's WebAssembly is loaded from
 * the installed package, never from the network. A barcode a PDF draws as lines, not as a picture, is not read.
 */
import "server-only";

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const MAX_PAGES = 3;
const MAX_PICTURES = 6;
const MAX_SIDE = 4000;
const TIME_LIMIT_MS = 6000;
const FORMATS = ["Aztec", "PDF417", "QRCode", "DataMatrix"] as const;

type Pixels = { data: Uint8ClampedArray; width: number; height: number };
type Picture = { data: Uint8Array; width: number; height: number };

/** A PDF's picture as the decoder takes it. Null for one too small or too large to be a boarding pass barcode. */
function toRgba({ width, height, data }: Picture): Pixels | null {
  if (width > MAX_SIDE || height > MAX_SIDE || width < 20 || height < 20) return null;
  if (data.length < width * height * 4) return null;
  return { data: new Uint8ClampedArray(data), width, height };
}

let reader: Promise<typeof import("zxing-wasm/reader")> | null = null;

function loadReader() {
  reader ??= (async () => {
    const zxing = await import("zxing-wasm/reader");
    // Why the name is joined at run time: a literal path makes webpack try to bundle the .wasm, which fails the whole build.
    const wasmName = ["zxing-wasm", "reader", "zxing_reader.wasm"].join("/");
    const wasm = createRequire(import.meta.url).resolve(wasmName);
    const bytes = await readFile(wasm);
    zxing.prepareZXingModule({ overrides: { wasmBinary: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer } });
    return zxing;
  })();
  return reader;
}

const u16 = (bytes: Uint8Array, at: number) => (bytes[at] << 8) | bytes[at + 1];
const u32 = (bytes: Uint8Array, at: number) => bytes[at] * 0x1000000 + ((bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]);

/** A JPEG's size, off its first frame header. Null when there is none in the first 64 KB. */
function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  let at = 2;
  for (let markers = 0; markers < 200 && at + 9 < bytes.length && at < 65_536; markers += 1) {
    if (bytes[at] !== 0xff) return null;
    const marker = bytes[at + 1];
    const frame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (frame) return { height: u16(bytes, at + 5), width: u16(bytes, at + 7) };
    at += 2 + u16(bytes, at + 2);
  }
  return null;
}

/**
 * Why the size is read off the header first: a 100 KB PNG can declare 30000 × 30000 pixels, and decoding it
 * holds the server for seconds and takes a gigabyte. The decoder is synchronous, so no timer can stop it.
 */
export function pictureFits(mimeType: string, bytes: Uint8Array): boolean {
  const png = mimeType === "image/png" && bytes.length > 24 && u32(bytes, 0) === 0x89504e47;
  const size = png ? { width: u32(bytes, 16), height: u32(bytes, 20) } : mimeType === "image/jpeg" ? jpegSize(bytes) : null;
  return size !== null && size.width >= 20 && size.height >= 20 && size.width <= MAX_SIDE && size.height <= MAX_SIDE;
}

type Reader = Awaited<ReturnType<typeof loadReader>>;
const OPTIONS = { formats: [...FORMATS], tryHarder: true, maxNumberOfSymbols: 4 };

async function textsIn(zxing: Reader, picture: Uint8Array | Pixels): Promise<string[]> {
  const found = await zxing.readBarcodes(picture as Uint8Array | ImageData, OPTIONS);
  return found.flatMap((barcode) => (barcode.text ? [barcode.text] : []));
}

/** Why one picture at a time: holding every picture of a page at once is what makes a hostile PDF cost memory. */
async function pdfTexts(zxing: Reader, bytes: Uint8Array): Promise<string[]> {
  const { extractImages, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const texts: string[] = [];
  let looked = 0;
  for (let page = 1; page <= Math.min(pdf.numPages, MAX_PAGES) && looked < MAX_PICTURES; page += 1) {
    for (const picture of await extractImages(pdf, page)) {
      const rgba = toRgba(picture);
      if (!rgba || looked >= MAX_PICTURES) continue;
      looked += 1;
      texts.push(...(await textsIn(zxing, rgba)));
    }
  }
  return texts;
}

async function decode(file: { mimeType: string; bytes: Uint8Array }): Promise<string[]> {
  if (file.mimeType === "application/pdf") return pdfTexts(await loadReader(), file.bytes);
  if (!pictureFits(file.mimeType, file.bytes)) return [];
  return textsIn(await loadReader(), file.bytes);
}

/** Every barcode text found, or none. Never throws. */
export async function barcodeTexts(file: { mimeType: string; bytes: Uint8Array }): Promise<string[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<string[]>((resolve) => {
    timer = setTimeout(() => resolve([]), TIME_LIMIT_MS);
  });
  try {
    return await Promise.race([decode(file).catch(() => []), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
