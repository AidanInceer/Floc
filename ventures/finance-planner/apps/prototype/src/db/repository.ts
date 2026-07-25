// Repositories — the only place in the app that writes SQL.
//
// Two jobs:
//   1. Translate between domain objects (pounds, booleans, camelCase) and the
//      portable storage representation (pence, 0/1, snake_case).
//   2. Keep every statement inside the `?`-placeholder subset that both the
//      SQLite and Postgres drivers accept.
//
// Nothing here knows which engine it is talking to.

import type { SqlDriver, SqlValue } from "./driver";
import type {
  Account,
  AccountType,
  AppState,
  OneOff,
  Plan,
  Profile,
  Risk,
} from "../domain/types";
import { fromMinor, toMinor } from "../domain/money";

/** The prototype is single-household; the column exists so multi-user is a
 *  deployment change rather than a schema migration. */
export const HOUSEHOLD_ID = "hh_default";

const now = () => new Date().toISOString();

let counter = 0;
const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}`;

const bool = (v: SqlValue) => Number(v) === 1;
const flag = (v: boolean) => (v ? 1 : 0);

/**
 * Build a `SET a = ?, b = ?` fragment from a partial patch.
 * `columns` maps domain keys to [column, encoder] pairs; keys absent from the
 * patch are left untouched, so a partial update never clobbers a sibling field.
 */
function buildSet<T extends object>(
  patch: Partial<T>,
  columns: { [K in keyof T]?: [string, (v: T[K]) => SqlValue] },
): { clause: string; params: SqlValue[] } {
  const parts: string[] = [];
  const params: SqlValue[] = [];

  for (const key of Object.keys(patch) as (keyof T)[]) {
    const mapping = columns[key];
    if (!mapping || patch[key] === undefined) continue;
    const [column, encode] = mapping;
    parts.push(`${column} = ?`);
    params.push(encode(patch[key] as T[typeof key]));
  }

  return { clause: parts.join(", "), params };
}

// ── row shapes ──────────────────────────────────────────────────────────────

interface AccountRow {
  id: string;
  institution: string;
  name: string;
  type: string;
  balance: number;
  spendable: number;
  ringfenced: number;
}

interface OneOffRow {
  id: string;
  month: number;
  amount: number;
  label: string;
}

interface PlanRow {
  start_month: number;
  start_year: number;
  horizon: number;
  take_home: number;
  bonus_net: number;
  bonus_month: number;
  rent: number;
  completion_month: number;
  housing_monthly: number;
  card_spend: number;
  isa_monthly: number;
  isa_start_month: number;
  buffer_ceiling: number;
}

interface ProfileRow {
  name: string;
  risk: string;
  emergency_months: number;
  buffer_floor: number;
  onboarded: number;
}

// ── repositories ────────────────────────────────────────────────────────────

export function createRepositories(driver: SqlDriver, householdId = HOUSEHOLD_ID) {
  const accounts = {
    async list(): Promise<Account[]> {
      const rows = await driver.query<AccountRow>(
        `SELECT id, institution, name, type, balance, spendable, ringfenced
           FROM account
          WHERE household_id = ?
          ORDER BY sort_order, id`,
        [householdId],
      );
      return rows.map((r) => ({
        id: r.id,
        institution: r.institution,
        name: r.name,
        type: r.type as AccountType,
        balance: fromMinor(r.balance),
        spendable: bool(r.spendable),
        ringfenced: bool(r.ringfenced),
      }));
    },

    async insert(a: Omit<Account, "id">, id = newId("acc")): Promise<Account> {
      const [{ next } = { next: 0 }] = await driver.query<{ next: number }>(
        `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next
           FROM account WHERE household_id = ?`,
        [householdId],
      );
      await driver.exec(
        `INSERT INTO account
           (id, household_id, institution, name, type, balance, spendable, ringfenced, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          householdId,
          a.institution,
          a.name,
          a.type,
          toMinor(a.balance),
          flag(a.spendable),
          flag(a.ringfenced),
          Number(next),
          now(),
        ],
      );
      return { ...a, id };
    },

    async update(id: string, patch: Partial<Account>): Promise<void> {
      const { clause, params } = buildSet<Account>(patch, {
        institution: ["institution", (v) => v],
        name: ["name", (v) => v],
        type: ["type", (v) => v],
        balance: ["balance", toMinor],
        spendable: ["spendable", flag],
        ringfenced: ["ringfenced", flag],
      });
      if (!clause) return;
      await driver.exec(
        `UPDATE account SET ${clause}, updated_at = ? WHERE id = ? AND household_id = ?`,
        [...params, now(), id, householdId],
      );
    },

    async remove(id: string): Promise<void> {
      await driver.exec("DELETE FROM account WHERE id = ? AND household_id = ?", [
        id,
        householdId,
      ]);
    },
  };

  const oneOffs = {
    async list(): Promise<OneOff[]> {
      const rows = await driver.query<OneOffRow>(
        `SELECT id, month, amount, label
           FROM one_off WHERE household_id = ? ORDER BY month, id`,
        [householdId],
      );
      return rows.map((r) => ({
        id: r.id,
        month: Number(r.month),
        amount: fromMinor(r.amount),
        label: r.label,
      }));
    },

    async insert(o: Omit<OneOff, "id">, id = newId("one")): Promise<OneOff> {
      await driver.exec(
        `INSERT INTO one_off (id, household_id, month, amount, label, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, householdId, o.month, toMinor(o.amount), o.label, now()],
      );
      return { ...o, id };
    },

    async update(id: string, patch: Partial<OneOff>): Promise<void> {
      const { clause, params } = buildSet<OneOff>(patch, {
        month: ["month", (v) => v],
        amount: ["amount", toMinor],
        label: ["label", (v) => v],
      });
      if (!clause) return;
      await driver.exec(
        `UPDATE one_off SET ${clause}, updated_at = ? WHERE id = ? AND household_id = ?`,
        [...params, now(), id, householdId],
      );
    },

    async remove(id: string): Promise<void> {
      await driver.exec("DELETE FROM one_off WHERE id = ? AND household_id = ?", [
        id,
        householdId,
      ]);
    },
  };

  const plan = {
    async get(): Promise<Omit<Plan, "oneOffs"> | null> {
      const [r] = await driver.query<PlanRow>(
        `SELECT start_month, start_year, horizon, take_home, bonus_net, bonus_month,
                rent, completion_month, housing_monthly, card_spend, isa_monthly,
                isa_start_month, buffer_ceiling
           FROM plan WHERE household_id = ?`,
        [householdId],
      );
      if (!r) return null;
      return {
        startMonth: Number(r.start_month),
        startYear: Number(r.start_year),
        horizon: Number(r.horizon),
        takeHome: fromMinor(r.take_home),
        bonusNet: fromMinor(r.bonus_net),
        bonusMonth: Number(r.bonus_month),
        rent: fromMinor(r.rent),
        completionMonth: Number(r.completion_month),
        housingMonthly: fromMinor(r.housing_monthly),
        cardSpend: fromMinor(r.card_spend),
        isaMonthly: fromMinor(r.isa_monthly),
        isaStartMonth: Number(r.isa_start_month),
        bufferCeiling: fromMinor(r.buffer_ceiling),
      };
    },

    async upsert(p: Plan): Promise<void> {
      await driver.exec("DELETE FROM plan WHERE household_id = ?", [householdId]);
      await driver.exec(
        `INSERT INTO plan
           (household_id, start_month, start_year, horizon, take_home, bonus_net,
            bonus_month, rent, completion_month, housing_monthly, card_spend,
            isa_monthly, isa_start_month, buffer_ceiling, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          householdId,
          p.startMonth,
          p.startYear,
          p.horizon,
          toMinor(p.takeHome),
          toMinor(p.bonusNet),
          p.bonusMonth,
          toMinor(p.rent),
          p.completionMonth,
          toMinor(p.housingMonthly),
          toMinor(p.cardSpend),
          toMinor(p.isaMonthly),
          p.isaStartMonth,
          toMinor(p.bufferCeiling),
          now(),
        ],
      );
    },

    async update(patch: Partial<Plan>): Promise<void> {
      const { clause, params } = buildSet<Plan>(patch, {
        startMonth: ["start_month", (v) => v],
        startYear: ["start_year", (v) => v],
        horizon: ["horizon", (v) => v],
        takeHome: ["take_home", toMinor],
        bonusNet: ["bonus_net", toMinor],
        bonusMonth: ["bonus_month", (v) => v],
        rent: ["rent", toMinor],
        completionMonth: ["completion_month", (v) => v],
        housingMonthly: ["housing_monthly", toMinor],
        cardSpend: ["card_spend", toMinor],
        isaMonthly: ["isa_monthly", toMinor],
        isaStartMonth: ["isa_start_month", (v) => v],
        bufferCeiling: ["buffer_ceiling", toMinor],
      });
      if (!clause) return;
      await driver.exec(
        `UPDATE plan SET ${clause}, updated_at = ? WHERE household_id = ?`,
        [...params, now(), householdId],
      );
    },
  };

  const profile = {
    async get(): Promise<{ profile: Profile; onboarded: boolean } | null> {
      const [r] = await driver.query<ProfileRow>(
        `SELECT name, risk, emergency_months, buffer_floor, onboarded
           FROM profile WHERE household_id = ?`,
        [householdId],
      );
      if (!r) return null;
      return {
        profile: {
          name: r.name,
          risk: r.risk as Risk,
          emergencyMonths: Number(r.emergency_months),
          bufferFloor: fromMinor(r.buffer_floor),
        },
        onboarded: bool(r.onboarded),
      };
    },

    async upsert(p: Profile, onboarded: boolean): Promise<void> {
      await driver.exec("DELETE FROM profile WHERE household_id = ?", [householdId]);
      await driver.exec(
        `INSERT INTO profile
           (household_id, name, risk, emergency_months, buffer_floor, onboarded, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          householdId,
          p.name,
          p.risk,
          p.emergencyMonths,
          toMinor(p.bufferFloor),
          flag(onboarded),
          now(),
        ],
      );
    },

    async update(patch: Partial<Profile>): Promise<void> {
      const { clause, params } = buildSet<Profile>(patch, {
        name: ["name", (v) => v],
        risk: ["risk", (v) => v],
        emergencyMonths: ["emergency_months", (v) => v],
        bufferFloor: ["buffer_floor", toMinor],
      });
      if (!clause) return;
      await driver.exec(
        `UPDATE profile SET ${clause}, updated_at = ? WHERE household_id = ?`,
        [...params, now(), householdId],
      );
    },

    async setOnboarded(value: boolean): Promise<void> {
      await driver.exec(
        "UPDATE profile SET onboarded = ?, updated_at = ? WHERE household_id = ?",
        [flag(value), now(), householdId],
      );
    },
  };

  /** Read the whole application state back out. Returns null before seeding. */
  async function loadAppState(): Promise<AppState | null> {
    const [p, planRow] = await Promise.all([profile.get(), plan.get()]);
    if (!p || !planRow) return null;

    const [accountList, oneOffList] = await Promise.all([
      accounts.list(),
      oneOffs.list(),
    ]);

    return {
      onboarded: p.onboarded,
      profile: p.profile,
      accounts: accountList,
      plan: { ...planRow, oneOffs: oneOffList },
    };
  }

  /** Write a complete state into an empty database, in one transaction. */
  async function seedAppState(state: AppState): Promise<void> {
    await driver.transaction(async (tx) => {
      const repos = createRepositories(tx, householdId);
      await tx.exec("INSERT INTO household (id, created_at) VALUES (?, ?)", [
        householdId,
        now(),
      ]);
      await repos.profile.upsert(state.profile, state.onboarded);
      await repos.plan.upsert(state.plan);
      for (const a of state.accounts) {
        await repos.accounts.insert(a, a.id);
      }
      for (const o of state.plan.oneOffs) {
        await repos.oneOffs.insert(o, o.id);
      }
    });
  }

  /** Drop every row for this household. Used by "Reset data". */
  async function clearAll(): Promise<void> {
    await driver.transaction(async (tx) => {
      for (const table of ["one_off", "account", "plan", "profile", "household"]) {
        const column = table === "household" ? "id" : "household_id";
        await tx.exec(`DELETE FROM ${table} WHERE ${column} = ?`, [householdId]);
      }
    });
  }

  return { accounts, oneOffs, plan, profile, loadAppState, seedAppState, clearAll };
}

export type Repositories = ReturnType<typeof createRepositories>;
