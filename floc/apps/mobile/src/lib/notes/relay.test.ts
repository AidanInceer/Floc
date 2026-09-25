import * as Y from "yjs";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness";
import { describe, expect, it } from "vitest";

import { FROM_APP, FROM_PAGE, fromBase64, othersUpdate, sendChanges, takeChange, takeOthers, toBase64, wholeDoc } from "./relay";

describe("base64", () => {
  it("carries any bytes, long ones included", () => {
    const bytes = new Uint8Array(70_000).map((_, i) => i % 256);
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
  });
});

describe("the two copies of a page", () => {
  function pair() {
    const app = new Y.Doc();
    const page = new Y.Doc();
    const stops = [
      sendChanges(app, FROM_PAGE, (update) => takeChange(page, update, FROM_APP)),
      sendChanges(page, FROM_APP, (update) => takeChange(app, update, FROM_PAGE)),
    ];
    return { app, page, stop: () => stops.forEach((stop) => { stop(); }) };
  }

  it("starts the page from the app's whole doc", () => {
    const app = new Y.Doc();
    app.getText("t").insert(0, "Lisbon");
    const page = new Y.Doc();
    takeChange(page, wholeDoc(app), FROM_APP);
    expect(page.getText("t").toString()).toBe("Lisbon");
  });

  it("carries each side's typing to the other, once", () => {
    const { app, page, stop } = pair();
    let updates = 0;
    app.on("update", () => { updates += 1; });
    page.getText("t").insert(0, "Sintra");
    app.getText("t").insert(6, " and Cascais");
    expect(page.getText("t").toString()).toBe("Sintra and Cascais");
    expect(app.getText("t").toString()).toBe("Sintra and Cascais");
    expect(updates).toBe(2);
    stop();
    page.getText("t").insert(0, "x");
    expect(app.getText("t").toString()).toBe("Sintra and Cascais");
  });
});

describe("who else is on the page", () => {
  it("shows the page everyone but the app's own client, which is this person", () => {
    const app = new Awareness(new Y.Doc());
    const tom = new Awareness(new Y.Doc());
    const page = new Awareness(new Y.Doc());
    tom.setLocalState({ user: { name: "Tom" } });
    app.setLocalState({ user: { name: "Me" } });
    applyAwarenessUpdate(app, encodeAwarenessUpdate(tom, [tom.clientID]), "socket");
    expect(app.getStates().get(tom.clientID)).toEqual({ user: { name: "Tom" } });

    expect(othersUpdate(app, [app.clientID])).toBeNull();
    takeOthers(page, othersUpdate(app, [app.clientID, tom.clientID]) ?? "");
    expect(page.getStates().get(tom.clientID)).toEqual({ user: { name: "Tom" } });
    expect(page.getStates().has(app.clientID)).toBe(false);
  });
});
