/** Registers ./alias-loader.mjs — resolve hooks run off-thread, so they have
 *  to be installed rather than passed as the entry point. */
import { register } from "node:module";

register("./alias-loader.mjs", import.meta.url);
