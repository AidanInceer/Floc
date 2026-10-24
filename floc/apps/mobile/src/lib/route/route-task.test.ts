import { beforeEach, describe, expect, it, vi } from "vitest";

const disk = new Map<string, string>();
const state = vi.hoisted(() => ({
  task: null as null | ((body: { data?: unknown; error?: unknown }) => Promise<void>),
  started: false,
  fg: "granted",
  bg: "granted",
  record: vi.fn(),
}));

vi.mock("expo-file-system", () => {
  class File {
    uri: string;
    constructor(folder: string, name: string) {
      this.uri = `${folder}/${name}`;
    }
    get exists() {
      return disk.has(this.uri);
    }
    create() {
      disk.set(this.uri, "");
    }
    text() {
      return Promise.resolve(disk.get(this.uri) ?? "");
    }
    write(text: string) {
      disk.set(this.uri, text);
    }
  }
  return { File, Paths: { document: "doc" } };
});

vi.mock("expo-task-manager", () => ({
  defineTask: (_name: string, fn: typeof state.task) => {
    state.task = fn;
  },
}));

vi.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: () => Promise.resolve({ status: state.fg }),
  requestBackgroundPermissionsAsync: () => Promise.resolve({ status: state.bg }),
  startLocationUpdatesAsync: () => {
    state.started = true;
    return Promise.resolve();
  },
  stopLocationUpdatesAsync: () => {
    state.started = false;
    return Promise.resolve();
  },
  hasStartedLocationUpdatesAsync: () => Promise.resolve(state.started),
}));

vi.mock("../api", () => ({ client: { route: { record: { mutate: state.record } } } }));

const { flushRoute, recordingTrip, startRoute, stopRoute } = await import("./route-task");
const { readRoute, writeRoute } = await import("./route-store");

const location = (timestamp: number) => ({ coords: { latitude: 38.7, longitude: -9.1 }, timestamp });
const FAR = "2999-12-31";

beforeEach(() => {
  disk.clear();
  Object.assign(state, { started: false, fg: "granted", bg: "granted" });
  state.record.mockReset().mockResolvedValue(1);
});

describe("switching route recording on and off (#329)", () => {
  it("starts once both location prompts are allowed, and says which trip", async () => {
    expect(await startRoute({ tripId: 7, endDate: FAR })).toBeNull();
    expect(await recordingTrip()).toBe(7);
    await stopRoute();
    expect(await recordingTrip()).toBeNull();
  });

  it("names the prompt that was refused and records nothing", async () => {
    state.fg = "denied";
    expect(await startRoute({ tripId: 7, endDate: FAR })).toBe("foreground");
    Object.assign(state, { fg: "granted", bg: "denied" });
    expect(await startRoute({ tripId: 7, endDate: FAR })).toBe("background");
    expect(state.started).toBe(false);
  });
});

describe("the background task", () => {
  it("queues each position and uploads it", async () => {
    await startRoute({ tripId: 7, endDate: FAR });
    await state.task?.({ data: { locations: [location(1000)] } });
    expect(state.record).toHaveBeenCalledWith({ tripId: 7, positions: [expect.objectContaining({ recordedAt: 1000 })] });
    expect((await readRoute()).queue).toEqual([]);
  });

  it("keeps positions while offline and sends them later", async () => {
    await startRoute({ tripId: 7, endDate: FAR });
    state.record.mockRejectedValueOnce(new Error("offline"));
    await state.task?.({ data: { locations: [location(1000)] } });
    expect((await readRoute()).queue).toHaveLength(1);
    await flushRoute();
    expect((await readRoute()).queue).toEqual([]);
  });

  it("stops by itself after the trip's last day", async () => {
    await startRoute({ tripId: 7, endDate: "2000-01-01" });
    await state.task?.({ data: { locations: [location(1000)] } });
    expect(state.record).not.toHaveBeenCalled();
    expect(await recordingTrip()).toBeNull();
  });

  it("does nothing on an error, or when not switched on", async () => {
    await state.task?.({ error: new Error("no fix") });
    await state.task?.({ data: { locations: [location(1000)] } });
    expect(state.record).not.toHaveBeenCalled();
  });
});

describe("the stored file", () => {
  it("reads as empty when it is not there or not readable", async () => {
    expect(await readRoute()).toEqual({ tracking: null, queue: [] });
    await writeRoute({ tracking: null, queue: [] });
    disk.set("doc/route.json", "{not json");
    expect(await readRoute()).toEqual({ tracking: null, queue: [] });
  });
});
