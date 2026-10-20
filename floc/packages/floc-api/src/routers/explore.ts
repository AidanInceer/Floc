/**
 * Explore — your last finder. The listings themselves are static
 * `@floc/core` data both clients read directly.
 */
import { NIGHTS_SCALE } from "@floc/core/trip/explore/finder/finder";
import { readFinder } from "@floc/core/trip/explore/finder/finder-read";
import { ALL_TAGS, type TripTag } from "@floc/core/trip/explore/finder/tag-groups";
import { REGIONS } from "@floc/core/trip/explore/preset-trips";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

const night = z.number().int().min(NIGHTS_SCALE.min).max(NIGHTS_SCALE.max);
const pounds = z.number().int().min(0).nullable();

const finder = z
  .object({
    q: z.string().max(80),
    regions: z.array(z.enum(REGIONS)).max(REGIONS.length),
    months: z.array(z.number().int().min(1).max(12)).max(12),
    nights: z.object({ min: night, max: night }).nullable(),
    price: z.object({ unit: z.enum(["trip", "night"]), min: pounds, max: pounds }),
    likes: z.array(z.enum(ALL_TAGS as [TripTag, ...TripTag[]])).max(ALL_TAGS.length),
  })
  // Why: the shape is checked above; readFinder drops a range that is upside down or off its unit's scale.
  .transform((input) => readFinder(input) ?? input);

export const exploreRouter = router({
  get: protectedProcedure.query(({ ctx }) => ctx.port.loadExplore(ctx.viewer.id)),

  setFinder: protectedProcedure.input(finder).mutation(({ ctx, input }) => ctx.port.setExploreFinder(ctx.viewer.id, input)),
});
