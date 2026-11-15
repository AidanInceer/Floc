import { afterEach, describe, expect, it, vi } from "vitest";

import { browserConsent, chooseConsent, consentCookie, cookieValue, forgetBrowserConsent, onConsentChange } from "./consent-cookie";

const page = (cookie = "", protocol = "https:") => {
  const doc = { cookie };
  const removed: string[] = [];
  vi.stubGlobal("document", doc);
  vi.stubGlobal("location", { protocol });
  vi.stubGlobal("localStorage", { removeItem: (k: string) => removed.push(k), "floc-folds:1:2": "[]", "floc-theme": "dark" });
  return { doc, removed };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  forgetBrowserConsent();
});

describe("the consent cookie", () => {
  it("lasts a year at most, for this site only", () => {
    const cookie = consentCookie({ functional: true, analytics: false }, "2026-11-15", true);
    expect(cookie).toBe("floc_consent=1.f1.a0.2026-11-15; Max-Age=31536000; Path=/; SameSite=Lax; Secure");
    expect(consentCookie({ functional: false, analytics: false }, "2026-11-15", false)).not.toContain("Secure");
  });

  it("is found among the other cookies on a request", () => {
    expect(cookieValue("a=1; floc_consent=1.f0.a1.2026-11-15; b=2", "floc_consent")).toBe("1.f0.a1.2026-11-15");
    expect(cookieValue("xfloc_consent=no", "floc_consent")).toBeNull();
    expect(cookieValue(null, "floc_consent")).toBeNull();
  });

  it("is unanswered in a browser that has made no choice", () => {
    page("theme=dark");
    expect(browserConsent()).toBeNull();
  });

  it("stores a choice and tells whoever is listening", () => {
    vi.useFakeTimers({ now: new Date("2026-11-15T10:00:00") });
    const { doc } = page();
    const heard = vi.fn();
    const stop = onConsentChange(heard);
    chooseConsent({ functional: true, analytics: true });
    stop();
    expect(doc.cookie).toContain("floc_consent=1.f1.a1.2026-11-15");
    expect(browserConsent()).toEqual({ functional: true, analytics: true });
    expect(heard).toHaveBeenCalledOnce();
  });

  it("removes what it remembered when the answer is no", () => {
    const { removed } = page();
    chooseConsent({ functional: false, analytics: true });
    expect(removed).toEqual(["floc:ideas-sort", "floc-folds:1:2"]);
  });
});
