import { describe, expect, it, vi } from "vitest";

import { resendAttachments } from "./resend-attachments";

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

function fakeFetch(list: unknown[]) {
  return vi.fn<Fetcher>(async (url) => {
    if (url.includes("/emails/receiving/")) {
      return new Response(JSON.stringify({ object: "list", data: list }));
    }
    return new Response(new Uint8Array([1, 2, 3]));
  });
}

const row = (over: Record<string, unknown> = {}) => ({
  id: "a1",
  filename: "booking.pdf",
  size: 3,
  content_type: "application/pdf",
  content_disposition: "attachment",
  download_url: "https://inbound-cdn.resend.test/a1",
  ...over,
});

describe("attachments of a received email (#328)", () => {
  it("lists them with the key, then downloads each", async () => {
    const fetcher = fakeFetch([row()]);
    const files = await resendAttachments("email-1", "re_key", fetcher);

    expect(fetcher.mock.calls[0][0]).toBe("https://api.resend.com/emails/receiving/email-1/attachments");
    expect(fetcher.mock.calls[0][1]).toMatchObject({ headers: { Authorization: "Bearer re_key" } });
    expect(files).toEqual([
      { filename: "booking.pdf", contentType: "application/pdf", inline: false, sizeBytes: 3, bytes: new Uint8Array([1, 2, 3]) },
    ]);
  });

  it("marks an attachment drawn inside the email as inline", async () => {
    const files = await resendAttachments("e", "k", fakeFetch([row({ content_disposition: "inline" })]));
    expect(files[0].inline).toBe(true);
  });

  it("does not download a file too big to keep, and passes its size on so the refusal names it", async () => {
    const fetcher = fakeFetch([row({ size: 20 * 1024 * 1024 })]);
    const files = await resendAttachments("e", "k", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(files[0]).toMatchObject({ bytes: null, sizeBytes: 20 * 1024 * 1024 });
  });

  it("throws when Resend will not list them, so the webhook is tried again", async () => {
    const fetcher = vi.fn<Fetcher>(async () => new Response("no", { status: 500 }));
    await expect(resendAttachments("e", "k", fetcher)).rejects.toThrow();
  });
});
