-- 001_init — baseline schema.
--
-- This DDL is written to run unmodified on both SQLite and PostgreSQL:
--   * money is BIGINT in minor units (pence) — never a float, per the venture
--     golden rule. Conversion to/from pounds happens in the repository layer.
--   * booleans are INTEGER 0/1 (SQLite has no BOOLEAN; Postgres accepts INTEGER).
--   * ids are application-generated TEXT — no AUTOINCREMENT / SERIAL / IDENTITY.
--   * timestamps are TEXT, ISO-8601 UTC.
--
-- `household_id` is on every row from day one. The prototype only ever has one
-- household, but carrying the column means multi-user Postgres is a deployment
-- change rather than a migration of every table.

CREATE TABLE IF NOT EXISTS household (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profile (
  household_id      TEXT PRIMARY KEY REFERENCES household(id),
  name              TEXT    NOT NULL,
  risk              TEXT    NOT NULL,
  emergency_months  INTEGER NOT NULL,
  buffer_floor      BIGINT  NOT NULL,
  onboarded         INTEGER NOT NULL DEFAULT 0,
  updated_at        TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS account (
  id            TEXT PRIMARY KEY,
  household_id  TEXT    NOT NULL REFERENCES household(id),
  institution   TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  type          TEXT    NOT NULL,
  balance       BIGINT  NOT NULL,
  spendable     INTEGER NOT NULL DEFAULT 1,
  ringfenced    INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_account_household ON account (household_id);

CREATE TABLE IF NOT EXISTS plan (
  household_id      TEXT PRIMARY KEY REFERENCES household(id),
  start_month       INTEGER NOT NULL,
  start_year        INTEGER NOT NULL,
  horizon           INTEGER NOT NULL,
  take_home         BIGINT  NOT NULL,
  bonus_net         BIGINT  NOT NULL,
  bonus_month       INTEGER NOT NULL,
  rent              BIGINT  NOT NULL,
  completion_month  INTEGER NOT NULL,
  housing_monthly   BIGINT  NOT NULL,
  card_spend        BIGINT  NOT NULL,
  isa_monthly       BIGINT  NOT NULL,
  isa_start_month   INTEGER NOT NULL,
  buffer_ceiling    BIGINT  NOT NULL,
  updated_at        TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS one_off (
  id            TEXT PRIMARY KEY,
  household_id  TEXT    NOT NULL REFERENCES household(id),
  month         INTEGER NOT NULL,
  amount        BIGINT  NOT NULL,
  label         TEXT    NOT NULL,
  updated_at    TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_one_off_household ON one_off (household_id);
