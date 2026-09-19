import "server-only";

// Base64 expands an 8 MB file to 10.7 MB; leave room for JSON and metadata.
const MAX_API_BODY_BYTES = 12 * 1024 * 1024;

export async function boundedRequest(req: Request): Promise<Request | null> {
  if (Number(req.headers.get("content-length")) > MAX_API_BODY_BYTES) {
    await req.body?.cancel();
    return null;
  }
  if (!req.body) return req;

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_API_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new Request(req, { body: Buffer.concat(chunks, length) });
}
