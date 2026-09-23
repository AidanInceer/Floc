import io


def sub(path, old, new):
    s = io.open(path, encoding="utf-8", newline="").read()
    crlf = "\r\n" in s
    o = old.replace("\n", "\r\n") if crlf else old
    n = new.replace("\n", "\r\n") if crlf else new
    assert s.count(o) == 1, (path, "matches=%d" % s.count(o), old[:60])
    io.open(path, "w", encoding="utf-8", newline="").write(s.replace(o, n))


p = "floc/apps/web/src/db/schema.ts"
# The .scratch path it named as source of truth is long gone; the ERD is the live one.
sub(p, """/**
 * Floc v1 physical schema — SQLite/libSQL dialect via Drizzle.
 * Source of truth: .scratch/floc-v1/issues/04-core-data-model-and-schema.md, docs/architecture/data-model/erd.html
 *
 * Every application table carries id, created_at, deleted_at (soft-delete), last_modified_at.
 * `last_modified_at` is debugging-only — no optimistic locking in v1 (ticket 12).
 * Better Auth's `user`/`session`/`account`/`verification` are declared here for FKs/joins
 * but are Better Auth's shape — don't hand-edit; our columns live on `user_profile` (ticket 06).
 */""",
    """/**
 * The schema of record — SQLite/libSQL via Drizzle. Mirrors docs/architecture/data-model/erd.html.
 *
 * Every application table carries id, created_at, deleted_at (soft-delete) and last_modified_at.
 * `last_modified_at` is debugging only — no optimistic locking (#12). Better Auth's `user`,
 * `session`, `account` and `verification` are declared here for FKs and joins but are Better
 * Auth's shape: never hand-edit them, our columns live on `user_profile` (#06).
 */""")
sub(p, """/**
 * A named invite: one person asked one friend onto one trip (ticket 146).
 * Deliberately not a `trip_membership` row with a status — teaching ~40 reads
 * to say "member, but only accepted" is how rule 5's enumeration-proofing
 * leaks. Accepting writes the membership; that's the only access change.
 * Unique on (trip, invitee) with no `deleted_at`, same shape as
 * `friendship_pair_idx` — declining leaves the row for re-inviting to reuse.
 */""",
    """/**
 * A named invite: one person asked one friend onto one trip (#146).
 *
 * Why: not a `trip_membership` row with a status — teaching ~40 reads to say "member, but only
 * accepted" is how rule 5's enumeration-proofing leaks. Accepting writes the membership, and that
 * is the only access change. Unique on (trip, invitee) with no `deleted_at`, so declining leaves
 * the row for a re-invite to reuse.
 */""")
sub(p, """/**
 * A thing to pack (ticket 219, extended by 220). One table, two lists: a null
 * `owner_id` is the trip's shared gear, a set one is that person's own bag and
 * is never read for anybody else.
 *
 * `packed_at` here is the *personal* tick and is meaningless on a shared line —
 * a shared line is packed when every claim on it is, which `packing_claim`
 * answers. The two are genuinely different questions: a personal line has no
 * claimers to ask, so it has to carry its own.
 */""",
    """/**
 * A thing to pack (#219, #220). One table, two lists: a null `owner_id` is the trip's shared gear,
 * a set one is that person's own bag and is never read for anybody else.
 *
 * Why: `packed_at` is the personal tick and means nothing on a shared line — that one is packed
 * when every `packing_claim` on it is. A personal line has no claimers to ask, so it carries its own.
 */""")
sub(p, """/**
 * A saved packing list of your own (ticket 230) — "photography kit", "gym
 * stuff". Yours, not a trip's: it has no `trip_id`, and it is copied into a
 * trip's bag rather than linked to one, so editing the kit later never rewrites
 * a bag you have already tidied.
 *
 * Called a kit here because "packing list" already means the trip's list; the
 * UI says "saved list", which is what a person calls it.
 */""",
    """/**
 * A saved packing list of your own (#230). No `trip_id`: it is copied into a bag rather than linked
 * to one, so editing the kit later never rewrites a bag you have already tidied. Called a kit here
 * because "packing list" already means the trip's list; the UI says "saved list".
 */""")
sub(p, """/**
 * A single real-world payment from one member to another, recorded after money
 * moved off-app (cash, ticket: money overhaul). Its own thing, not a flag on a
 * split: settle-up is one transfer netted across many bills, and it never maps
 * to one owed row. An immutable fact — reverted only by soft-delete, which
 * makes the balance recompute as if it never happened. Balances are still
 * derived at read time (non-negotiable, rule 04): expenses − settlements, per
 * currency.
 */""",
    """/**
 * One real-world payment between members, recorded after money moved off-app.
 *
 * Why: its own table, not a flag on a split — settle-up is one transfer netted across many bills
 * and never maps to one owed row. An immutable fact, reverted only by soft-delete, so the balance
 * recomputes as if it never happened. Balances stay derived at read time: expenses − settlements,
 * per currency.
 */""")
sub(p, """/** One thing in a saved list. Same three fields a real packing row carries, so applying one is a straight copy. */""",
    """// Why: the same three fields a real packing row carries, so applying a kit is a straight copy.""")
print("done")
