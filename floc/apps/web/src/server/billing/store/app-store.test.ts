import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readAppStoreNotification,
  verifyAppStoreTransaction,
} from "@/server/billing/store/app-store";

// Why: the real verifier checks Apple's certificate chain, which no test can sign.
const decoded = vi.hoisted(() => ({
  transactions: new Map<string, Record<string, unknown>>(),
  notifications: new Map<string, Record<string, unknown>>(),
  sandboxOnly: new Set<string>(),
}));

vi.mock("@apple/app-store-server-library", () => ({
  Environment: { PRODUCTION: "Production", SANDBOX: "Sandbox" },
  SignedDataVerifier: class {
    constructor(
      _certs: Buffer[],
      _online: boolean,
      private environment: string,
    ) {}
    private pick<T>(map: Map<string, T>, jws: string): T {
      const found = map.get(jws);
      if (!found || (decoded.sandboxOnly.has(jws) && this.environment !== "Sandbox")) {
        throw new Error("bad signature");
      }
      return found;
    }
    verifyAndDecodeTransaction = async (jws: string) => this.pick(decoded.transactions, jws);
    verifyAndDecodeNotification = async (jws: string) => this.pick(decoded.notifications, jws);
    verifyAndDecodeRenewalInfo = async () => ({ autoRenewStatus: 0 });
  },
}));

const TX = { originalTransactionId: "orig-1", productId: "floc_pro_yearly", expiresDate: 1 };

beforeEach(() => {
  process.env.APPLE_BUNDLE_ID = "com.floc.app";
  process.env.APPLE_APP_ID = "123";
  process.env.APPLE_ROOT_CERTS = Buffer.from("cert").toString("base64");
  decoded.transactions.clear();
  decoded.notifications.clear();
  decoded.sandboxOnly.clear();
});
afterEach(() => {
  delete process.env.APPLE_BUNDLE_ID;
  delete process.env.APPLE_APP_ID;
  delete process.env.APPLE_ROOT_CERTS;
});

describe("checking a transaction with Apple", () => {
  it("is unavailable when the keys are not set", async () => {
    delete process.env.APPLE_ROOT_CERTS;
    expect(await verifyAppStoreTransaction("jws")).toBe("unavailable");
  });

  it("reads a production transaction", async () => {
    decoded.transactions.set("jws", TX);
    expect(await verifyAppStoreTransaction("jws")).toMatchObject({ storeTransactionId: "orig-1" });
  });

  it("reads a sandbox transaction too, because review and TestFlight buy in the sandbox", async () => {
    decoded.transactions.set("jws", TX);
    decoded.sandboxOnly.add("jws");
    expect(await verifyAppStoreTransaction("jws")).toMatchObject({ storeTransactionId: "orig-1" });
  });

  it("refuses what neither environment will sign for", async () => {
    expect(await verifyAppStoreTransaction("forged")).toBe("refused");
  });

  it("refuses a signed transaction with nothing to key it on", async () => {
    decoded.transactions.set("jws", { productId: "floc_pro_yearly" });
    expect(await verifyAppStoreTransaction("jws")).toBe("refused");
  });
});

describe("reading an App Store notification", () => {
  it("is unavailable when the keys are not set", async () => {
    delete process.env.APPLE_APP_ID;
    expect(await readAppStoreNotification("payload")).toBe("unavailable");
  });

  it("reads the transaction, its renewal and its status", async () => {
    decoded.transactions.set("tx", TX);
    decoded.notifications.set("payload", {
      data: { signedTransactionInfo: "tx", signedRenewalInfo: "renewal", status: 3 },
    });

    expect(await readAppStoreNotification("payload")).toMatchObject({
      storeTransactionId: "orig-1",
      status: "past_due",
      cancelAtPeriodEnd: true,
    });
  });

  it("ignores a notification about no transaction, such as a test ping", async () => {
    decoded.notifications.set("payload", { notificationType: "TEST", data: {} });
    expect(await readAppStoreNotification("payload")).toBe("ignored");
  });

  it("ignores a transaction it cannot key", async () => {
    decoded.transactions.set("tx", { productId: "floc_pro_yearly" });
    decoded.notifications.set("payload", { data: { signedTransactionInfo: "tx" } });
    expect(await readAppStoreNotification("payload")).toBe("ignored");
  });

  it("refuses a notification Apple did not sign", async () => {
    expect(await readAppStoreNotification("forged")).toBe("refused");
  });
});
