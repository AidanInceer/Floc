// The clicks the benchmark times. `run` returns ms from pointerdown to `done`.
// Writes alternate between two values, so every round starts from the seeded state.

/** A tab's page is in: its address, no loading skeleton, and the mark only it draws. */
const tabIn = ({ path, mark, text }) =>
  location.pathname.endsWith(path) &&
  !document.querySelector('[aria-busy="true"]') &&
  [...document.querySelectorAll(mark)].some((el) => !text || el.textContent === text);

const TAB_MARK = {
  overview: { path: "/overview", mark: 'section[aria-label="Whole trip"]' },
  dates: { path: "/dates", mark: "h1", text: "Dates" },
  days: { path: "/days", mark: "[data-day-column]" },
  money: { path: "/money", mark: "h1", text: "Money" },
  packing: { path: "/packing", mark: "h1", text: "Packing" },
  notes: { path: "/notes", mark: 'section[aria-label="Notes"]' },
  files: { path: "/files", mark: "h1", text: "Files" },
};

const TAB_LABEL = {
  overview: "Overview",
  dates: "Dates",
  days: "Days",
  money: "Money",
  packing: "Packing",
  notes: "Notes",
  files: "Files",
};

async function openTab(ctx, key) {
  await ctx.page.goto(`${ctx.base}/trip/${ctx.trip}/${key}`);
  await ctx.page.waitForFunction(tabIn, TAB_MARK[key]);
}

const tabLink = (ctx, key) =>
  ctx.page.getByRole("navigation", { name: "Trip sections" }).getByRole("link", { name: TAB_LABEL[key] });

function tabSwitch(from, to) {
  return {
    id: `tab.${from}-${to}`,
    area: "Navigation",
    label: `${TAB_LABEL[from]} tab → ${TAB_LABEL[to]} page drawn`,
    setup: (ctx) => openTab(ctx, from),
    run: (ctx) => ctx.timeClick(tabLink(ctx, to), tabIn, TAB_MARK[to]),
  };
}

function tabHighlight(from, to) {
  return {
    id: `tab.mark-${to}`,
    area: "Navigation",
    label: `${TAB_LABEL[from]} tab → ${TAB_LABEL[to]} tab shows as current`,
    setup: (ctx) => openTab(ctx, from),
    run: (ctx) =>
      ctx.timeClick(
        tabLink(ctx, to),
        (label) =>
          [...document.querySelectorAll('nav[aria-label="Trip sections"] a[aria-current="page"]')].some((a) =>
            a.textContent.includes(label),
          ),
        TAB_LABEL[to],
      ),
  };
}

const EVENT = "Dinner in Alfama";

const socks = (ctx) => `Perf socks ${ctx.tag}`;
const tickName = (ctx) => new RegExp(`^(Mark ${socks(ctx)} packed|Unpack ${socks(ctx)})$`);

/** The calendar block, not the dialog: its aria-label starts with the title. */
const blockHas = ({ title, cls }) =>
  [...document.querySelectorAll("[data-day-column] button[aria-label]")].some(
    (b) => b.getAttribute("aria-label").startsWith(`${title},`) && b.className.includes(cls),
  );

const dialogOpen = (title) => {
  const input = document.querySelector('dialog[open] input[name="title"]');
  return !!input && input.value === title;
};

async function openEvent(ctx) {
  await openTab(ctx, "days");
  await ctx.page.getByRole("button", { name: new RegExp(`^${EVENT},`) }).first().click();
  await ctx.page.waitForFunction(dialogOpen, EVENT);
}

/** Lets the debounced autosave land, so the next sample starts with nothing in flight. */
async function settleSave(ctx) {
  await ctx.page.waitForFunction(() => {
    const status = document.querySelector('dialog[open] [role="status"]');
    return !status || status.textContent === "Saved";
  });
  await ctx.page.waitForTimeout(1500);
  await ctx.page.waitForLoadState("networkidle");
}

/** Food ↔ Activity, from whatever the dialog shows now. */
async function nextType(ctx) {
  const head = await ctx.page.locator("dialog[open] form > div").first().getAttribute("class");
  return head.includes("bg-pastel-yellow") ? { tile: "Activity", cls: "bg-pastel-blue" } : { tile: "Food", cls: "bg-pastel-yellow" };
}

export const SCENARIOS = [
  {
    id: "trips.open-trip",
    area: "Navigation",
    label: "My trips → trip Overview drawn",
    setup: async (ctx) => {
      await ctx.page.goto(`${ctx.base}/trips`);
      await ctx.page.waitForLoadState("networkidle");
    },
    run: (ctx) =>
      ctx.timeClick(
        ctx.page.getByRole("link", { name: /Portugal, late summer/ }).first(),
        tabIn,
        TAB_MARK.overview,
      ),
  },
  tabSwitch("overview", "days"),
  tabSwitch("days", "money"),
  tabSwitch("money", "packing"),
  tabSwitch("packing", "dates"),
  tabSwitch("dates", "notes"),
  tabSwitch("notes", "files"),
  tabSwitch("files", "overview"),
  tabHighlight("overview", "days"),

  {
    id: "days.open-event",
    area: "Days",
    label: "Click an event → its form open",
    setup: (ctx) => openTab(ctx, "days"),
    run: (ctx) =>
      ctx.timeClick(ctx.page.getByRole("button", { name: new RegExp(`^${EVENT},`) }).first(), dialogOpen, EVENT),
  },
  {
    id: "days.type-head",
    area: "Days",
    label: "Change event type → dialog head recoloured",
    setup: (ctx, i) => (i === 0 ? openEvent(ctx) : null),
    run: async (ctx) => {
      const { tile, cls } = await nextType(ctx);
      return ctx.timeClick(
        ctx.page.getByRole("dialog").getByRole("group", { name: "Type" }).getByRole("button", { name: tile }),
        (c) => !!document.querySelector('dialog[open] form > div')?.className.includes(c),
        cls,
      );
    },
    teardown: settleSave,
  },
  {
    id: "days.type-block",
    area: "Days",
    label: "Change event type → calendar block recoloured",
    setup: (ctx, i) => (i === 0 ? openEvent(ctx) : null),
    run: async (ctx) => {
      const { tile, cls } = await nextType(ctx);
      return ctx.timeClick(
        ctx.page.getByRole("dialog").getByRole("group", { name: "Type" }).getByRole("button", { name: tile }),
        blockHas,
        { title: EVENT, cls },
      );
    },
    teardown: settleSave,
  },
  {
    id: "days.all-day-block",
    area: "Days",
    label: "Tick All day → block moves to the all-day row",
    setup: (ctx, i) => (i === 0 ? openEvent(ctx) : null),
    run: (ctx) =>
      ctx.timeClick(
        ctx.page.getByRole("dialog").getByRole("button", { name: "All day" }),
        ({ title, allDay }) =>
          [...document.querySelectorAll("button[aria-label]")].some((b) =>
            b.getAttribute("aria-label").startsWith(`${title}, all day`),
          ) === allDay,
        { title: EVENT, allDay: true },
      ),
    teardown: async (ctx) => {
      await settleSave(ctx);
      await ctx.page.getByRole("dialog").getByRole("button", { name: "All day" }).click();
      await ctx.page.getByRole("dialog").getByLabel("Starts").fill("19:30");
      await ctx.page.getByRole("dialog").getByLabel("Event name").click();
      await ctx.page.waitForFunction(blockHas, { title: EVENT, cls: "bg-pastel" });
      await settleSave(ctx);
    },
  },
  {
    id: "days.close-event",
    area: "Days",
    label: "Close the event dialog → dialog gone",
    setup: openEvent,
    run: (ctx) =>
      ctx.timeClick(
        ctx.page.getByRole("dialog").getByRole("button", { name: "Close" }),
        () => !document.querySelector('dialog[open]'),
      ),
  },
  {
    id: "days.next-day",
    area: "Days",
    label: "Day after → next day in focus",
    setup: (ctx) => openTab(ctx, "days"),
    run: async (ctx) => {
      const before = await ctx.page.locator("h2").first().textContent();
      return ctx.timeClick(
        ctx.page.getByRole("button", { name: "Day after" }),
        (was) => document.querySelector("h2")?.textContent !== was,
        before,
      );
    },
  },
  {
    id: "days.post-comment",
    area: "Days",
    label: "Post a comment → comment shown",
    setup: async (ctx, i) => {
      if (i === 0) await openEvent(ctx);
      await ctx.page.getByRole("dialog").getByRole("textbox", { name: "Comment" }).fill(`Perf comment ${ctx.tag} ${i}`);
    },
    run: (ctx, i) =>
      ctx.timeClick(
        ctx.page.getByRole("dialog").getByRole("button", { name: "Post" }),
        (body) => [...document.querySelectorAll("dialog[open] article p")].some((p) => p.textContent === body),
        `Perf comment ${ctx.tag} ${i}`,
      ),
    teardown: (ctx) => ctx.page.waitForLoadState("networkidle"),
  },
  {
    id: "days.heart",
    area: "Days",
    label: "Like a comment → heart fills",
    setup: async (ctx, i) => {
      if (i > 0) return;
      await openEvent(ctx);
      const like = ctx.page.getByRole("dialog").getByRole("button", { name: /^Like,/ });
      if (!(await like.count())) {
        await ctx.page.getByRole("dialog").getByRole("textbox", { name: "Comment" }).fill("Something to like");
        await ctx.page.getByRole("dialog").getByRole("button", { name: "Post" }).click();
        await like.first().waitFor();
      }
    },
    run: async (ctx) => {
      const heart = ctx.page.getByRole("dialog").getByRole("button", { name: /^Like,/ }).first();
      const pressed = await heart.getAttribute("aria-pressed");
      return ctx.timeClick(
        heart,
        (was) => document.querySelector('dialog[open] button[title="Like"]')?.getAttribute("aria-pressed") !== was,
        pressed,
      );
    },
    teardown: (ctx) => ctx.page.waitForLoadState("networkidle"),
  },
  {
    id: "money.add-expense",
    area: "Money",
    label: "Add expense → its form open",
    setup: (ctx) => openTab(ctx, "money"),
    run: (ctx) =>
      ctx.timeClick(ctx.page.getByRole("button", { name: "Add expense" }), () => !!document.querySelector('dialog[open] form')),
  },
  {
    id: "packing.add",
    area: "Packing",
    label: "Add to your bag → row shown",
    setup: async (ctx, i) => {
      if (i === 0) await openTab(ctx, "packing");
      // Why: the field clears itself when the last add settles; typing before that loses the words.
      await ctx.page.getByRole("button", { name: "Add", exact: true }).waitFor();
      await ctx.page.waitForFunction(() => document.querySelector('input[name="label"]')?.value === "");
      await ctx.page.getByRole("textbox", { name: "Add to your bag" }).fill(`Perf ${ctx.tag} ${i}`);
    },
    run: (ctx, i) =>
      ctx.timeClick(
        ctx.page.getByRole("button", { name: "Add", exact: true }),
        (label) => !!document.querySelector(`button[aria-label="Mark ${label} packed"]`),
        `Perf ${ctx.tag} ${i}`,
      ),
    teardown: (ctx) => ctx.page.waitForLoadState("networkidle"),
  },
  {
    id: "packing.tick",
    area: "Packing",
    label: "Tick a line in your bag → box ticked",
    setup: async (ctx, i) => {
      if (i > 0) return;
      await openTab(ctx, "packing");
      await ctx.page.getByRole("textbox", { name: "Add to your bag" }).fill(socks(ctx));
      await ctx.page.getByRole("button", { name: "Add", exact: true }).click();
      await ctx.page.getByRole("button", { name: tickName(ctx) }).waitFor();
      await ctx.page.waitForLoadState("networkidle");
    },
    run: async (ctx) => {
      const box = ctx.page.getByRole("button", { name: tickName(ctx) });
      const was = await box.getAttribute("aria-label");
      return ctx.timeClick(box, (w) => !document.querySelector(`button[aria-label="${w}"]`), was);
    },
    teardown: (ctx) => ctx.page.waitForLoadState("networkidle"),
  },
];
