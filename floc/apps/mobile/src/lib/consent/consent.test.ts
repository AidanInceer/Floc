import { describe, expect, it, vi } from "vitest";

vi.mock("expo-secure-store", () => ({ getItemAsync: vi.fn(), setItemAsync: vi.fn() }));

import { encodeConsent } from "@floc/core/consent/consent";
import { today } from "@floc/core/dates/dates";

import { currentConsent, loadConsent, onConsentChange, saveConsent } from "./consent";

const store = (value: string | null = null) => {
  const held = { value };
  return {
    held,
    getItemAsync: vi.fn(async () => held.value),
    setItemAsync: vi.fn(async (_key: string, next: string) => {
      held.value = next;
    }),
  };
};

describe("the consent choice on the phone", () => {
  it("is a no until the person says yes", async () => {
    expect(await loadConsent(store())).toEqual({ functional: false, analytics: false });
  });

  it("keeps a yes across a restart", async () => {
    const s = store();
    await saveConsent({ functional: false, analytics: true }, s);
    expect(s.held.value).toBe(encodeConsent({ functional: false, analytics: true }, today()));
    expect(await loadConsent(s)).toEqual({ functional: false, analytics: true });
    expect(currentConsent().analytics).toBe(true);
  });

  it("is a no again once the stored choice is a year old", async () => {
    expect((await loadConsent(store("1.f1.a1.2020-01-01"))).analytics).toBe(false);
  });

  it("is a no when the phone refuses the store", async () => {
    const refused = { getItemAsync: vi.fn(async () => { throw new Error("locked"); }), setItemAsync: vi.fn() };
    expect((await loadConsent(refused)).analytics).toBe(false);
  });

  it("tells a listener when the choice changes", async () => {
    const heard = vi.fn();
    const stop = onConsentChange(heard);
    await saveConsent({ functional: false, analytics: true }, store());
    stop();
    expect(heard).toHaveBeenCalledOnce();
  });
});
