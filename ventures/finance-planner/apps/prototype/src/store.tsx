// Application state, backed by SQL.
//
// The shape of this file is "optimistic memory, write-through to the database":
// React holds the current `AppState` so the forecast can recompute
// synchronously as you drag a number, and every mutation also issues the
// corresponding SQL. On reload the state comes back out of the database.
//
// Mutations stay fire-and-forget rather than awaiting the write, because the
// UI must not stall on persistence for a keystroke. `error` surfaces a failed
// write so it is visible rather than silent.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Account, AppState, OneOff, Plan, Profile } from "./domain/types";
import { computeForecast } from "./domain/forecast";
import { runRubrics } from "./domain/rubrics";
import { openDatabase, destroyDatabase } from "./db";
import type { Repositories, SqlDriver } from "./db";

export type StoreStatus = "loading" | "ready" | "error";

interface Store {
  status: StoreStatus;
  error: string | null;
  state: AppState;
  forecast: ReturnType<typeof computeForecast>;
  rubrics: ReturnType<typeof runRubrics>;
  setProfile: (p: Partial<Profile>) => void;
  setPlan: (p: Partial<Plan>) => void;
  addAccount: (a: Omit<Account, "id">) => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  removeAccount: (id: string) => void;
  addOneOff: (o: Omit<OneOff, "id">) => void;
  updateOneOff: (id: string, patch: Partial<OneOff>) => void;
  removeOneOff: (id: string) => void;
  completeOnboarding: () => void;
  reset: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

/** Rendered before the database has opened; never shown to the user. */
const EMPTY: AppState = {
  onboarded: false,
  profile: { name: "", risk: "balanced", emergencyMonths: 6, bufferFloor: 0 },
  accounts: [],
  plan: {
    startMonth: 0,
    startYear: new Date().getFullYear(),
    horizon: 12,
    takeHome: 0,
    bonusNet: 0,
    bonusMonth: 0,
    rent: 0,
    completionMonth: 1,
    housingMonthly: 0,
    cardSpend: 0,
    isaMonthly: 0,
    isaStartMonth: 1,
    bufferCeiling: 0,
    oneOffs: [],
  },
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StoreStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<AppState>(EMPTY);

  const dbRef = useRef<{ driver: SqlDriver; repos: Repositories } | null>(null);

  const open = useCallback(async () => {
    setStatus("loading");
    try {
      const { driver, repos } = await openDatabase();
      dbRef.current = { driver, repos };
      const loaded = await repos.loadAppState();
      if (!loaded) throw new Error("database opened but returned no state");
      setState(loaded);
      setStatus("ready");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void open();
  }, [open]);

  /** Issue a write, surfacing any failure instead of swallowing it. */
  const write = useCallback((run: (repos: Repositories) => Promise<unknown>) => {
    const db = dbRef.current;
    if (!db) return;
    void run(db.repos).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : String(err));
    });
  }, []);

  const forecast = useMemo(
    () => computeForecast(state.plan, state.accounts),
    [state.plan, state.accounts],
  );
  const rubrics = useMemo(
    () => runRubrics(state.accounts, state.plan, state.profile, forecast),
    [state.accounts, state.plan, state.profile, forecast],
  );

  const store: Store = {
    status,
    error,
    state,
    forecast,
    rubrics,

    setProfile: (p) => {
      setState((s) => ({ ...s, profile: { ...s.profile, ...p } }));
      write((r) => r.profile.update(p));
    },

    setPlan: (p) => {
      setState((s) => ({ ...s, plan: { ...s.plan, ...p } }));
      write((r) => r.plan.update(p));
    },

    addAccount: (a) => {
      write(async (r) => {
        const created = await r.accounts.insert(a);
        setState((s) => ({ ...s, accounts: [...s.accounts, created] }));
      });
    },

    updateAccount: (id, patch) => {
      setState((s) => ({
        ...s,
        accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      }));
      write((r) => r.accounts.update(id, patch));
    },

    removeAccount: (id) => {
      setState((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id) }));
      write((r) => r.accounts.remove(id));
    },

    addOneOff: (o) => {
      write(async (r) => {
        const created = await r.oneOffs.insert(o);
        setState((s) => ({
          ...s,
          plan: { ...s.plan, oneOffs: [...s.plan.oneOffs, created] },
        }));
      });
    },

    updateOneOff: (id, patch) => {
      setState((s) => ({
        ...s,
        plan: {
          ...s.plan,
          oneOffs: s.plan.oneOffs.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        },
      }));
      write((r) => r.oneOffs.update(id, patch));
    },

    removeOneOff: (id) => {
      setState((s) => ({
        ...s,
        plan: { ...s.plan, oneOffs: s.plan.oneOffs.filter((o) => o.id !== id) },
      }));
      write((r) => r.oneOffs.remove(id));
    },

    completeOnboarding: () => {
      setState((s) => ({ ...s, onboarded: true }));
      write((r) => r.profile.setOnboarded(true));
    },

    reset: async () => {
      const db = dbRef.current;
      if (db) await destroyDatabase(db.driver);
      dbRef.current = null;
      await open();
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}
