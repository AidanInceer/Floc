import { expect, test, type Page } from "@playwright/test";

import { priya } from "./people";

type Finding = { kind: "sideways-scroll" | "clipped" | "overlap"; what: string };

// Why: the visual slips Aidan kept catching by eye (#no-ticket, design card "Layout") — measured, not judged.
async function layoutFindings(page: Page): Promise<Finding[]> {
  return page.evaluate(() => {
    const out: { kind: "sideways-scroll" | "clipped" | "overlap"; what: string }[] = [];
    const root = document.documentElement;
    if (root.scrollWidth > root.clientWidth + 1) {
      out.push({ kind: "sideways-scroll", what: `page is ${root.scrollWidth}px wide in a ${root.clientWidth}px window` });
    }

    const label = (el: Element) => {
      const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
      const cls = typeof el.className === "string" ? el.className.split(" ").slice(0, 3).join(".") : "";
      return `<${el.tagName.toLowerCase()}${cls ? "." + cls : ""}> "${text}"`;
    };

    const ancestors = (el: Element) => {
      const list: Element[] = [];
      for (let at: Element | null = el; at && at !== document.body; at = at.parentElement) list.push(at);
      return list;
    };

    const shown = (el: Element) => {
      if (el.closest("[aria-hidden='true'], [hidden], .sr-only, dialog:not([open])")) return false;
      const closed = el.closest("details:not([open])");
      if (closed && !el.closest("summary")) return false;
      for (const at of ancestors(el)) {
        const style = getComputedStyle(at);
        if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
      }
      const box = el.getBoundingClientRect();
      return box.width > 2 && box.height > 2;
    };

    // Why: an avatar stack overlaps on purpose (negative margin), and a scaled demo is a picture of the app, not the app.
    const meantToOverlap = (el: Element) =>
      ancestors(el).slice(0, 3).some((at) => {
        const style = getComputedStyle(at);
        return parseFloat(style.marginLeft) < 0 || parseFloat(style.marginTop) < 0;
      }) ||
      ancestors(el).some((at) => {
        const t = getComputedStyle(at).transform;
        return t !== "none" && new DOMMatrixReadOnly(t).a !== 1;
      });

    const textLeaves = [...document.body.querySelectorAll("*")].filter(
      (el) =>
        shown(el) &&
        [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim().length > 0),
    );

    for (const el of textLeaves) {
      const style = getComputedStyle(el);
      const hides = /hidden|clip/.test(style.overflowX) || /hidden|clip/.test(style.overflow);
      if (hides && style.textOverflow !== "ellipsis" && el.scrollWidth > el.clientWidth + 1) {
        out.push({ kind: "clipped", what: label(el) });
      }
    }

    // Why: a layer (a card in a deck, a popover, the tour) sits over the page on purpose; only text in one layer can collide.
    const layer = (el: Element) =>
      ancestors(el).find((at) => /absolute|fixed|sticky/.test(getComputedStyle(at).position)) ?? null;

    const glyphs = (el: Element) => {
      const range = document.createRange();
      const style = getComputedStyle(el);
      const clip = /hidden|clip/.test(style.overflowX) ? el.getBoundingClientRect() : null;
      return [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim())
        .flatMap((n) => {
          range.selectNodeContents(n);
          return [...range.getClientRects()].map((r) =>
            clip ? new DOMRect(r.left, r.top, Math.max(0, Math.min(r.right, clip.right) - r.left), r.height) : r,
          );
        })
        .filter((r) => r.width > 1 && r.height > 1);
    };

    const texts = textLeaves
      .filter((el) => !meantToOverlap(el))
      .map((el) => ({ el, layer: layer(el), rects: glyphs(el) }));
    for (let i = 0; i < texts.length; i += 1) {
      for (let j = i + 1; j < texts.length; j += 1) {
        const a = texts[i];
        const b = texts[j];
        if (a.layer !== b.layer || a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const hit = a.rects.some((p) =>
          b.rects.some((q) => {
            const w = Math.min(p.right, q.right) - Math.max(p.left, q.left);
            const h = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
            return w > 2 && h > 0.4 * Math.min(p.height, q.height);
          }),
        );
        if (hit) out.push({ kind: "overlap", what: `${label(a.el)} overlaps ${label(b.el)}` });
      }
    }
    return out;
  });
}

const WIDTHS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "phone", width: 375, height: 812 },
];

const TRIP_TABS = ["", "/dates", "/days", "/ideas", "/money", "/packing", "/files", "/notes"];

// Why: the first-trip walkthrough opens only while Priya is on one trip, so whether it shows depends on the order specs ran in.
async function skipWelcome(page: Page) {
  const welcome = page.getByRole("dialog", { name: "Welcome to Floc" });
  await page.addLocatorHandler(welcome, () => welcome.getByRole("button", { name: "Skip" }).click());
}

const settle = (page: Page) =>
  page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));

async function portugal(page: Page) {
  await skipWelcome(page);
  await page.goto("/trips");
  await page.getByText("Portugal, late summer").first().click();
  await expect(page).toHaveURL(/\/trip\/\d+/);
  return new URL(page.url()).pathname.match(/\/trip\/\d+/)![0];
}

async function expectClean(page: Page, where: string) {
  await page.waitForLoadState("networkidle");
  const findings = await layoutFindings(page);
  expect.soft(findings.map((f) => `${f.kind}: ${f.what}`), `${where} has layout slips`).toEqual([]);
}

for (const size of WIDTHS) {
  test.describe(`layout at ${size.width}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test("the front door", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const path of ["/", "/explore", "/login"]) {
        await page.goto(path);
        await expectClean(page, path);
      }
    });

    test.describe("signed in", () => {
      test.use({ storageState: priya.state });

      test("my trips and every trip tab", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto("/trips");
        await expectClean(page, "/trips");
        const trip = await portugal(page);
        for (const tab of TRIP_TABS) {
          await page.goto(`${trip}${tab}`);
          await expectClean(page, `trip${tab || " overview"}`);
        }
      });

      test("a trip's menu on My trips opens whole, not cut off by its card", async ({ page }) => {
        await page.goto("/trips");
        await page.getByRole("button", { name: /^Actions for / }).first().click();
        const last = page.getByRole("menu").getByRole("button").last();
        await expect(last).toBeVisible();
        const onTop = await last.evaluate((el) => {
          const box = el.getBoundingClientRect();
          const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return hit !== null && el.contains(hit);
        });
        expect(onTop).toBe(true);
      });

      test("a long trip name still fits", async ({ page }) => {
        const name = `Bosnia and Herzegovina, Montenegro and the long way round ${size.width}`;
        await skipWelcome(page);
        await page.goto("/trips");
        await page.getByRole("button", { name: "New trip" }).click();
        await page.getByRole("dialog").getByLabel("Name").fill(name);
        await page.getByRole("button", { name: "Create trip" }).click();
        await expect(page).toHaveURL(/\/trip\/\d+/);
        await expect(page.getByRole("heading", { level: 1 })).toContainText("Bosnia And Herzegovina");
        await expectClean(page, "long-named trip");
        await page.goto("/trips");
        await expectClean(page, "/trips with a long name");
      });

      test("picking another day keeps the calendar still", async ({ page }) => {
        const trip = await portugal(page);
        await page.goto(`${trip}/days`);
        const today = page.locator("button[aria-current='date']").first();
        await expect(today).toBeVisible();
        const other = page.locator("button[title]:not([aria-current])").filter({ has: page.locator("b.nums") });
        await page.mouse.wheel(0, 200);
        await settle(page);
        const before = await page.evaluate(() => scrollY);
        const stripBefore = (await today.boundingBox())!.y;
        const picked = other.nth(2);
        const title = (await picked.getAttribute("title"))!;
        await picked.click();
        await expect(page.getByTitle(title, { exact: true })).toHaveAttribute("aria-current", "date");
        await settle(page);
        expect(await page.evaluate(() => scrollY), "the page scrolled when a day was picked").toBe(before);
        const stripAfter = (await page.locator("button[aria-current='date']").first().boundingBox())!.y;
        expect(Math.abs(stripAfter - stripBefore), "the day strip moved when a day was picked").toBeLessThanOrEqual(2);
      });
    });
  });
}

test("the check sees sideways scroll, clipped text and colliding text", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 600 });
  await page.setContent(`
    <body style="margin:0;font:16px sans-serif">
      <div style="width:500px">wide</div>
      <p style="width:60px;overflow:hidden;white-space:nowrap">A name far too long to fit</p>
      <div style="position:relative;height:40px">
        <span style="position:relative">Lisbon</span><span style="margin-left:-30px;position:relative;top:0">Porto</span>
      </div>
      <div style="display:flex;width:80px"><b style="flex:none;width:30px;white-space:nowrap">Overlapping</b><i>£40</i></div>
    </body>`);
  const kinds = new Set((await layoutFindings(page)).map((f) => f.kind));
  expect([...kinds].sort()).toEqual(["clipped", "overlap", "sideways-scroll"]);
});
