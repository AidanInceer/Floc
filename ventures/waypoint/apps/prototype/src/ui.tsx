import { useEffect, useState } from "react";
import type { Member } from "./types";

export function Who({ m, sm = true }: { m: Member | undefined; sm?: boolean }) {
  if (!m) return null;
  return (
    <i className={`who${sm ? " sm" : ""} pen${m.pen}`} title={m.name} aria-hidden="true">
      {m.initials}
    </i>
  );
}

export function byId(members: Member[], id: string) {
  return members.find((m) => m.id === id);
}

/* ---------- routing ---------- */

export type Route = { name: "cover" } | { name: "trips" } | { name: "trip"; tripId: string; tab: string };

function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "t" && parts[1]) return { name: "trip", tripId: parts[1], tab: parts[2] ?? "decide" };
  if (parts[0] === "trips") return { name: "trips" };
  return { name: "cover" };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parse(location.hash));
      // A page change starts at the top; in-page tabs are state, not routes,
      // so they never come through here and never move the scroll.
      window.scrollTo({ top: 0 });
    };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function go(to: string) {
  location.hash = to;
}
