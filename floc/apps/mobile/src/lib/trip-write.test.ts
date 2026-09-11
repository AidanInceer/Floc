import { beforeEach, describe, expect, it, vi } from "vitest";

type Mutation = {
  options: { onSuccess: () => void; key: string };
  mutate: ReturnType<typeof vi.fn>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: { message: string } | null;
};

const mutations: Mutation[] = [];
const invalidateQueries = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries }),
  useMutation: (options: Mutation["options"]) => {
    const mutation: Mutation = { options, mutate: vi.fn(), isPending: false, isSuccess: false, isError: false, error: null };
    mutations.push(mutation);
    return mutation;
  },
}));

const procedure = (key: string) => ({
  queryKey: (input?: unknown) => [key, input],
  mutationOptions: () => ({ key }),
});
vi.mock("./api", () => ({
  trpc: {
    trips: {
      get: procedure("trips.get"),
      list: procedure("trips.list"),
      update: procedure("trips.update"),
      setArchived: procedure("trips.setArchived"),
      delete: procedure("trips.delete"),
    },
  },
}));

const { useTripWrite } = await import("./trip-write");

const byKey = (key: string) => mutations.find((m) => m.options.key === key)!;

beforeEach(() => {
  mutations.length = 0;
  invalidateQueries.mockClear();
});

describe("useTripWrite", () => {
  it("saves a trimmed name with the colour and tags", () => {
    const write = useTripWrite(7, vi.fn());
    write.save({ name: "  Lisbon  ", color: null, tags: ["food"] });
    expect(byKey("trips.update").mutate).toHaveBeenCalledWith({ tripId: 7, name: "Lisbon", colorKey: null, tags: ["food"] });
  });

  it("does not save a blank name", () => {
    const write = useTripWrite(7, vi.fn());
    write.save({ name: "   ", color: null, tags: [] });
    expect(byKey("trips.update").mutate).not.toHaveBeenCalled();
  });

  it("refreshes the trip and the list after a save, and stays put", () => {
    const onGone = vi.fn();
    useTripWrite(7, onGone);
    byKey("trips.update").options.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["trips.get", { tripId: 7 }] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["trips.list", undefined] });
    expect(onGone).not.toHaveBeenCalled();
  });

  it("archives and deletes this trip, then leaves", () => {
    const onGone = vi.fn();
    const write = useTripWrite(7, onGone);

    write.setArchived(true);
    expect(byKey("trips.setArchived").mutate).toHaveBeenCalledWith({ tripId: 7, archived: true });
    write.destroy();
    expect(byKey("trips.delete").mutate).toHaveBeenCalledWith({ tripId: 7 });

    byKey("trips.setArchived").options.onSuccess();
    byKey("trips.delete").options.onSuccess();
    expect(onGone).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledTimes(4);
  });

  it("starts idle", () => {
    expect(useTripWrite(7, vi.fn())).toMatchObject({ saving: false, saved: false, leaving: false, error: null });
  });
});

describe("useTripWrite state", () => {
  it("surfaces a failed save's message and a pending archive", async () => {
    vi.resetModules();
    vi.doMock("@tanstack/react-query", () => ({
      useQueryClient: () => ({ invalidateQueries }),
      useMutation: (options: { key: string }) => ({
        mutate: vi.fn(),
        isPending: options.key === "trips.setArchived",
        isSuccess: false,
        isError: options.key === "trips.update",
        error: options.key === "trips.update" ? { message: "Name taken" } : null,
      }),
    }));
    const fresh = await import("./trip-write");
    expect(fresh.useTripWrite(7, vi.fn())).toMatchObject({ leaving: true, error: "Name taken" });
  });
});
