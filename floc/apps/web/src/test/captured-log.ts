import { vi } from "vitest";

type Line = Record<string, unknown>;

/** The JSON lines `log` writes while `run` runs, parsed. */
export function capturedLog(run: () => void): Line[] {
  const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  try {
    run();
    return write.mock.calls.map(([line]) => JSON.parse(String(line)) as Line);
  } finally {
    write.mockRestore();
  }
}

/** The same, for work that awaits; gives back its result too. */
export async function capturedLogAsync<T>(run: () => Promise<T>): Promise<{ result: T; lines: Line[] }> {
  const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  try {
    const result = await run();
    return { result, lines: write.mock.calls.map(([line]) => JSON.parse(String(line)) as Line) };
  } finally {
    write.mockRestore();
  }
}
