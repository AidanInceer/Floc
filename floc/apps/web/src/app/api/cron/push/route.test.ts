import { afterEach, expect, it, vi } from "vitest";

import { capturedLogAsync } from "@/test/captured-log";

vi.mock("@/server/notifications/reminders", () => ({ sendDueReminders: async () => 1 }));
vi.mock("@/server/notifications/push", () => ({ sendDuePushes: async () => { throw new Error("Expo is down"); } }));
vi.mock("@/server/notifications/email-fallback", () => ({ sendDueEmails: async () => 2 }));
vi.mock("@/server/notes/pages/page-purge", () => ({ purgeArchivedPages: async () => 0 }));
vi.mock("@/server/guests/guest-purge", () => ({ purgeOldGuests: async () => 0 }));
vi.mock("@/server/documents/archive/archive", () => ({ purgeArchivedFiles: async () => 3 }));
vi.mock("@/server/documents/bookings/booking-inbox", () => ({ purgeWaitingBookings: async () => 4 }));

import { POST } from "./route";

afterEach(() => vi.unstubAllEnvs());

const call = (authorization: string) =>
  POST(new Request("http://localhost/api/cron/push", { method: "POST", headers: { authorization } }));

it("hides itself from a caller without the cron secret", async () => {
  vi.stubEnv("CRON_SECRET", "cron-secret");
  expect((await call("Bearer wrong")).status).toBe(404);
});

it("runs the other jobs when one fails, and logs the failed one", async () => {
  vi.stubEnv("CRON_SECRET", "cron-secret");
  const { result, lines } = await capturedLogAsync(() => call("Bearer cron-secret"));
  expect(result.status).toBe(500);
  expect(await result.json()).toEqual({ reminders: 1, pushes: null, emails: 2, pages: 0, guests: 0, files: 3, bookings: 4 });
  expect(lines).toEqual([expect.objectContaining({ level: "error", message: "cron.failed", job: "push", errorType: "Error" })]);
});
