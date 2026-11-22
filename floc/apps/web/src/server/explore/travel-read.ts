import "server-only";

import { sql } from "drizzle-orm";

import { today } from "@floc/core/dates/dates";
import { CURRENCIES, type Currency } from "@floc/core/money/currency";
import type { PastSpend, PastTrip, TravelProfile } from "@floc/core/trip/explore/fit/travel-profile";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { TRANSPORT_TYPES, type TransportType } from "@floc/core/vocabulary";

import { db } from "@/db";
import { LIMITS } from "@/server/limits";

export type PastTravel = Pick<TravelProfile, "saved" | "wantToGo" | "past">;

type Row = { kind: "want" | "saved" | "trip"; nights: number | null; a: string | null; b: number | null; c: string | null; d: string | null };

const LISTED = new Set(PRESET_TRIPS.map((trip) => trip.id));
const list = (joined: string | null) => (joined ? joined.split(",") : []);
const isMove = (value: string): value is TransportType => (TRANSPORT_TYPES as readonly string[]).includes(value);
const isCurrency = (value: string): value is Currency => (CURRENCIES as readonly string[]).includes(value);

function spendOf(joined: string | null): PastSpend[] {
  return list(joined).flatMap((part) => {
    const [currency = "", minor = ""] = part.split(":");
    return isCurrency(currency) && Number(minor) > 0 ? [{ currency, minor: Number(minor) }] : [];
  });
}

const tripOf = (row: Row): PastTrip => ({
  nights: row.nights ?? 0,
  countries: list(row.a),
  stops: row.b ?? 0,
  moves: list(row.c).filter(isMove),
  spend: spendOf(row.d),
});

export async function loadPastTravel(userId: string): Promise<PastTravel> {
  const rows = await db.all<Row>(sql`
    select 'want' as kind, null as nights, group_concat(country_code) as a, null as b, null as c, null as d
      from user_country_mark
      where user_id = ${userId} and state = 'yellow' and deleted_at is null
    union all
    select 'saved', null, group_concat(preset_id), null, null, null
      from (
        select preset_id from explore_save
        where user_id = ${userId} and deleted_at is null
        order by last_modified_at desc limit ${PRESET_TRIPS.length}
      )
    union all
    select 'trip', nights, countries, stops, moves, spend
      from (
        select
          cast(julianday(t.end_date) - julianday(t.start_date) as integer) as nights,
          (select group_concat(distinct p.country_code) from day d join place p on p.id = d.overnight_place_id
            where d.trip_id = t.id and d.deleted_at is null and p.country_code is not null) as countries,
          (select count(distinct d.overnight_place_id) from day d
            where d.trip_id = t.id and d.deleted_at is null) as stops,
          (select group_concat(e.transport_type) from day d join day_event e on e.day_id = d.id
            where d.trip_id = t.id and d.deleted_at is null and e.deleted_at is null
              and e.type = 'transport' and e.transport_type is not null) as moves,
          (select group_concat(x.currency || ':' || x.total) from (
            select ex.currency as currency, sum(s.owed_amount_minor) as total
              from expense ex join expense_split s on s.expense_id = ex.id
              where ex.trip_id = t.id and ex.deleted_at is null and s.deleted_at is null and s.user_id = ${userId}
              group by ex.currency
          ) x) as spend
        from trip t join trip_membership m on m.trip_id = t.id
        where m.user_id = ${userId} and m.deleted_at is null and t.deleted_at is null
          and t.start_date is not null and t.end_date is not null and t.end_date < ${today()}
        order by t.end_date desc limit ${LIMITS.fitPastTrips}
      )
  `);
  const of = (kind: Row["kind"]) => rows.filter((row) => row.kind === kind);
  return {
    wantToGo: of("want").flatMap((row) => list(row.a)),
    saved: of("saved").flatMap((row) => list(row.a)).filter((id) => LISTED.has(id)),
    past: of("trip").map(tripOf),
  };
}
