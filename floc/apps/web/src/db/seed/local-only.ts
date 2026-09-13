type Env = Record<string, string | undefined>;

export function assertLocalDatabase(env: Env = process.env): void {
  const url = env.TURSO_DATABASE_URL ?? "file:./local.db";
  if (env.NODE_ENV === "production" || !url.startsWith("file:")) {
    throw new Error(
      "Refusing: the dev seed only runs against a local file: database outside production.",
    );
  }
}
