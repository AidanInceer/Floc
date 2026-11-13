import { describe, expect, it } from "vitest";

import { barcodeTexts, pictureFits } from "./barcode";

const PASS = "M1DESMARAIS/LUC       EABC123 YULFRAAC 0834 226F001A0025 100";

async function barcodePng(text: string): Promise<Uint8Array> {
  const { writeBarcode } = await import("zxing-wasm/writer");
  const { readFile } = await import("node:fs/promises");
  const { createRequire } = await import("node:module");
  const { prepareZXingModule } = await import("zxing-wasm/writer");
  const wasm = await readFile(createRequire(import.meta.url).resolve("zxing-wasm/writer/zxing_writer.wasm"));
  prepareZXingModule({ overrides: { wasmBinary: wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength) as ArrayBuffer } });
  const made = await writeBarcode(text, { format: "Aztec", scale: 4 });
  return new Uint8Array(await made.image!.arrayBuffer());
}

describe("reading a boarding pass barcode off a file (#559)", () => {
  it("reads the barcode on a picture", async () => {
    expect(await barcodeTexts({ mimeType: "image/png", bytes: await barcodePng(PASS) })).toEqual([PASS]);
  });

  it("reads nothing from a picture with no barcode, a broken file, or a type it does not read", async () => {
    const junk = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
    expect(await barcodeTexts({ mimeType: "image/png", bytes: junk })).toEqual([]);
    expect(await barcodeTexts({ mimeType: "application/pdf", bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]) })).toEqual([]);
    expect(await barcodeTexts({ mimeType: "image/heic", bytes: junk })).toEqual([]);
  });

  const png = (width: number, height: number) => {
    const bytes = new Uint8Array(40);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
    new DataView(bytes.buffer).setUint32(16, width);
    new DataView(bytes.buffer).setUint32(20, height);
    return bytes;
  };
  const jpeg = (width: number, height: number) =>
    new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 11, 8, height >> 8, height & 255, width >> 8, width & 255, 1, 1, 0x11, 0]);

  it("refuses a picture whose header declares a huge size, before any decoding", async () => {
    expect(pictureFits("image/png", png(1200, 800))).toBe(true);
    expect(pictureFits("image/png", png(30000, 30000))).toBe(false);
    expect(pictureFits("image/png", png(800, 4001))).toBe(false);
    expect(pictureFits("image/png", png(10, 10))).toBe(false);
    expect(pictureFits("image/jpeg", jpeg(1200, 800))).toBe(true);
    expect(pictureFits("image/jpeg", jpeg(20000, 800))).toBe(false);
    expect(pictureFits("image/jpeg", new Uint8Array([0xff, 0xd8, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))).toBe(false);
    expect(pictureFits("image/png", jpeg(1200, 800))).toBe(false);
    expect(pictureFits("image/heic", png(1200, 800))).toBe(false);
    expect(await barcodeTexts({ mimeType: "image/png", bytes: png(30000, 30000) })).toEqual([]);
  });
});
