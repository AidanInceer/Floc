import { openLocalDb } from "./local-db.mjs";

const TRIPS = `
  select t.id, t.name, t.start_date as start, t.end_date as end,
    case
      when t.archived_at is not null then 'archived'
      when t.start_date is null then 'undated'
      when date('now', 'localtime') between t.start_date and t.end_date then 'NOW'
      when t.start_date > date('now', 'localtime') then 'upcoming'
      else 'past'
    end as "when",
    group_concat(u.email || case when m.role = 'admin' then ' (admin)' else '' end, ', ') as members
  from trip t
  join trip_membership m on m.trip_id = t.id and m.deleted_at is null
  join user u on u.id = m.user_id
  where t.deleted_at is null
  group by t.id
  order by t.id`;

const client = await openLocalDb();
try {
  const { rows } = await client.execute(TRIPS);
  for (const r of rows) {
    console.log(`#${r.id} ${r.name} · ${r.start ?? "no dates"}${r.end ? ` → ${r.end}` : ""} · ${r.when}`);
    console.log(`    ${r.members}`);
  }
  console.log(
    "\nSign in as anyone listed: the dev sign-in button on /login, or POST /api/dev/sign-in?email=<email>.",
  );
} finally {
  client.close();
}
