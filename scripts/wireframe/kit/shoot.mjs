// pnpm wireframe:shoot <path?variant=X> <out.png> [light|dark] [width] [height] [full]   (out is relative to the repo root)
// Env STEPS: steps run before the shot, split by ";;". click:<sel> · drag:<selA>>><selB> · hover:<sel> · type:<sel>>><text> · wait:<ms>
// Page errors and any sideways overflow are printed.
import { chromium } from "playwright";

const [, , path, out, theme = "light", width = "1280", height = "900", full = ""] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width, height: +height }, deviceScaleFactor: 1, hasTouch: +width < 700 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.addInitScript(() => localStorage.setItem("wf-variants-open", "0"));
await page.goto(`http://localhost:4100${path}`, { waitUntil: "networkidle" });
if (theme === "dark") await page.click('.wf-theme button[data-theme="dark"]');
const centre = async (sel) => { const el = page.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const b = await el.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
for (const step of (process.env.STEPS || "").split(";;").filter(Boolean)) {
  const [verb, rest] = [step.slice(0, step.indexOf(":")), step.slice(step.indexOf(":") + 1)];
  if (verb === "click") await page.locator(rest).first().click();
  if (verb === "hover") await page.mouse.move(...(await centre(rest)));
  if (verb === "wait") await page.waitForTimeout(+rest);
  if (verb === "type") { const [sel, text] = rest.split(">>"); await page.locator(sel).first().fill(text); }
  if (verb === "drag") {
    const [a, b] = rest.split(">>");
    const from = await centre(a);
    await page.mouse.move(...from);
    await page.mouse.down();
    const to = await centre(b);
    await page.mouse.move((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, { steps: 6 });
    await page.mouse.move(...to, { steps: 6 });
    await page.mouse.up();
  }
}
// CLEAN=1 hides the wireframe's own fixed furniture, so the shot shows only the design.
if (process.env.CLEAN) await page.evaluate(() => { for (const el of document.body.children) if (getComputedStyle(el).position === "fixed" && !el.matches("dialog, .toast")) el.style.display = "none"; });
await page.waitForTimeout(350);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
await page.screenshot({ path: out, fullPage: full === "full" });
await browser.close();
console.log(`${out} overflow=${overflow}${errors.length ? " ERRORS: " + errors.join(" | ") : ""}`);
