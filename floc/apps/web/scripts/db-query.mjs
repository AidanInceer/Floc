import { openLocalDb } from "./local-db.mjs";

const sql = process.argv.slice(2).join(" ").trim();
const LIMIT = 100;

if (!sql) {
  console.error('Usage: pnpm --filter floc-web db:query "select id, name from trip limit 5"');
  process.exit(1);
}

const client = await openLocalDb();
try {
  const { rows } = await client.execute(sql);
  console.table(rows.slice(0, LIMIT).map((row) => ({ ...row })));
  if (rows.length > LIMIT) console.log(`First ${LIMIT} of ${rows.length} rows.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  client.close();
}
