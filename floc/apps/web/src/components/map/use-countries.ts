"use client";

import { countriesFrom, type Countries, type Geo } from "@floc/globe/countries";
import { useEffect, useState } from "react";

let pending: Promise<Countries | null> | null = null;

// Why one promise: the outline is fetched once a page load, however many globes ask for it.
function loadCountries() {
  pending ??= fetch("/countries-110m.geojson")
    .then((res) => (res.ok ? res.json() : null))
    .then((body) => (body ? countriesFrom(body as Geo) : null))
    .catch(() => null);
  return pending;
}

/** The country outlines for the travel globe; null until they arrive, and for good if they never do (rule 11: the key and counts still show). */
export function useCountries(): Countries | null {
  const [land, setLand] = useState<Countries | null>(null);
  useEffect(() => {
    let live = true;
    void loadCountries().then((next) => {
      if (live) setLand(next);
    });
    return () => {
      live = false;
    };
  }, []);
  return land;
}
