// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IdeaRow } from "@floc/core/trip/ideas";
import { IdeasBox } from "./ideas-box";

vi.mock("@/app/trip/[id]/overview/actions", () => ({
  addIdea: vi.fn(async () => undefined),
  putIdeaOnDays: vi.fn(),
  removeIdea: vi.fn(async () => undefined),
  renameIdeaTitle: vi.fn(),
  undoIdeaOnDays: vi.fn(),
  undoRemoveIdea: vi.fn(),
  voteIdea: vi.fn(),
}));

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

const IDEA: IdeaRow = {
  id: 7,
  title: "Tram 28",
  category: "activities",
  createdAt: new Date("2026-11-01T10:00:00Z"),
  authorId: "u1",
  authorName: "Priya",
  authorAvatarIcon: null,
  votes: 0,
  mine: false,
};

let host: HTMLDivElement;
let root: Root;

const toggle = () => host.querySelector<HTMLButtonElement>("button[aria-controls]")!;
const fold = () => document.getElementById(toggle().getAttribute("aria-controls")!)!;
const notice = () => host.querySelector('[role="status"]');

async function show(ideas: IdeaRow[], startOpen: boolean) {
  await act(async () => {
    root.render(createElement(IdeasBox, { tripId: 1, ideas, days: [], startOpen, waiting: null }));
  });
}

async function press(button: HTMLButtonElement) {
  await act(async () => button.click());
}

async function addAnIdea(title: string) {
  const field = host.querySelector<HTMLInputElement>('input[name="title"]')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, title);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    field.form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

beforeEach(() => {
  (globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

describe("adding an idea while the Ideas box is closed", () => {
  it("opens the box", async () => {
    await show([], false);
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    await addAnIdea("Sunset at Miradouro");
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
  });

  it("shows no separate added line", async () => {
    await show([], false);
    await addAnIdea("Sunset at Miradouro");
    expect(notice()).toBeNull();
  });
});

describe("closing the Ideas box while a notice shows", () => {
  it("keeps the notice and its Undo in reach", async () => {
    await show([IDEA], true);
    await press(host.querySelector<HTMLButtonElement>('button[aria-label="More for Tram 28"]')!);
    const remove = [...host.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find((item) => item.textContent === "Remove")!;
    await press(remove);
    await press(toggle());
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(notice()?.textContent).toContain("Undo");
    expect(fold().contains(notice())).toBe(false);
  });
});
