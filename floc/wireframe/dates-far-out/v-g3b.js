import * as G3 from "./v-g3.js";

export const seed = () => ({});
export const view = (s) => ({ ...G3.view(s, true), cls: "marks" });
export const act = G3.act;
