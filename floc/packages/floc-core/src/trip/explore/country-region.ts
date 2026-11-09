import type { Region } from "./preset-trips";

// Why: the Caucasus and Turkey sit with Europe because Explore's own Georgia and Turkey trips do; the tests hold the two together.
const CODES: Record<Region, string> = {
  Europe:
    "AX AL AD AM AT AZ BY BE BA BG HR CY CZ DK EE FO FI FR GE DE GR GG HU IS IE IM IT JE XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH TR UA GB VA",
  Africa:
    "DZ AO BJ BW BF BI CM CV CF TD KM CD DJ EG GQ ER SZ ET GA GM GH GN GW CI KE LS LR LY MG MW ML MR MU MA MZ NA NE NG CG RW SH ST SN SC SL SO ZA SS SD TZ TG TN UG EH ZM ZW TF",
  Asia:
    "AF BH BD BT IO BN KH CN HK IN ID IR IQ IL JP JO KZ KW KG LA LB MO MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TM AE UZ VN YE",
  Americas:
    "AI AG AR AW BS BB BZ BM BO BR VG CA KY CL CO CR CU CW DM DO EC SV FK GL GD GT GY HT HN JM MX MS NI PA PY PE PR BL KN LC MF PM VC SX SR TT TC US VI UY VE GS",
  Oceania: "AS AU CK FM FJ PF GU HM KI MH NR NC NZ NU NF MP PW PG PN WS SB TO TV VU WF",
};

const REGION_OF = new Map(
  (Object.entries(CODES) as [Region, string][]).flatMap(([region, codes]) => codes.split(" ").map((code) => [code, region] as const)),
);

/** A country's continent, as Explore colours it; null for Antarctica. */
export const countryRegion = (code: string): Region | null => REGION_OF.get(code) ?? null;
