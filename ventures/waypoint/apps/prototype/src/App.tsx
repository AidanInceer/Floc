import { useEffect, useState } from "react";
import { chores, useStore } from "./store";
import { Cover } from "./pages/Cover";
import { Trips } from "./pages/Trips";
import { Decide } from "./pages/Decide";
import { Route } from "./pages/Route";
import { Days } from "./pages/Days";
import { Money } from "./pages/Money";
import { Chase } from "./pages/Chase";
import { go, useRoute } from "./ui";

const TABS = [
  { id: "decide", label: "Deciding" },
  { id: "route", label: "Route" },
  { id: "days", label: "Days" },
  { id: "money", label: "Money" },
  { id: "chase", label: "Loose ends" },
];

function useTheme() {
  // Light by default and never inherited from the OS (ADR 0012).
  const [dark, setDark] = useState(() => localStorage.getItem("waypoint.theme") === "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("waypoint.theme", dark ? "dark" : "light");
  }, [dark]);
  return [dark, setDark] as const;
}

export function App() {
  const { state } = useStore();
  const route = useRoute();
  const [dark, setDark] = useTheme();
  const waiting = chores(state);

  const trip = route.name === "trip" ? state.trips.find((t) => t.id === route.tripId) : undefined;

  return (
    <div className="shell">
      <header className="top">
        <button className="brand" onClick={() => go("#/")}>
          Waypoint <small>the trip book</small>
        </button>
        <span className="grow" />
        <nav className="tabs" aria-label={trip ? trip.title : "Pages"}>
          {trip ? (
            TABS.map((t) => {
              const n = t.id === "chase" ? waiting.filter((c) => c.tripId === trip.id).length : 0;
              return (
                <button
                  key={t.id}
                  aria-current={route.name === "trip" && route.tab === t.id ? "page" : undefined}
                  onClick={() => go(`#/t/${trip.id}/${t.id}`)}
                >
                  {t.label}
                  {n > 0 && <span className="badge">{n}</span>}
                </button>
              );
            })
          ) : (
            <>
              <button aria-current={route.name === "cover" ? "page" : undefined} onClick={() => go("#/")}>
                Cover
              </button>
              <button aria-current={route.name === "trips" ? "page" : undefined} onClick={() => go("#/trips")}>
                Trips
                {waiting.length > 0 && <span className="badge">{waiting.length}</span>}
              </button>
            </>
          )}
        </nav>
        {trip && (
          <button className="ghost" onClick={() => go("#/trips")}>
            Shelf
          </button>
        )}
        <button className="ghost" onClick={() => setDark(!dark)}>
          {dark ? "Day" : "Night"}
        </button>
      </header>

      {route.name === "cover" && <Cover />}
      {route.name === "trips" && <Trips />}
      {route.name === "trip" && !trip && (
        <main className="page">
          <div className="sheet">
            <div className="ruled">
              <div className="empty">
                <span className="hand">That book isn't on the shelf.</span>
                <button className="pen" onClick={() => go("#/trips")}>
                  Back to the shelf
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
      {route.name === "trip" && trip && (
        <main className="page" key={trip.id + route.tab}>
          {route.tab === "decide" && <Decide trip={trip} />}
          {route.tab === "route" && <Route trip={trip} />}
          {route.tab === "days" && <Days trip={trip} />}
          {route.tab === "money" && <Money trip={trip} />}
          {route.tab === "chase" && <Chase trip={trip} />}
        </main>
      )}
    </div>
  );
}
