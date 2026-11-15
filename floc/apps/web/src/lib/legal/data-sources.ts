/**
 * Every outside source of data or type that Floc uses, and whether its licence allows a paid product (#549).
 * The Legal page draws the credits from this list. `paidUse` other than "yes" is a gap with its fix beside it.
 */
export type DataSource = {
  what: string;
  from: string;
  url: string;
  licence: string;
  paidUse: "yes" | "within limits" | "no";
  note?: string;
};

export const DATA_SOURCES: DataSource[] = [
  {
    what: "Place search",
    from: "OpenStreetMap contributors, through Nominatim",
    url: "https://www.openstreetmap.org/copyright",
    licence: "Open Database Licence",
    paidUse: "within limits",
    note: "The public Nominatim server allows one request a second, which the place queue keeps. Past that, Floc needs its own or a paid server.",
  },
  {
    what: "Weather forecast",
    from: "Open-Meteo",
    url: "https://open-meteo.com/",
    licence: "CC BY 4.0",
    paidUse: "no",
    note: "The free API is for non-commercial use only, and an app with a subscription is commercial. Before Floc takes payment: buy Open-Meteo's commercial plan, or change to MET Norway (CC BY 4.0, free for commercial use).",
  },
  {
    what: "Exchange rates",
    from: "Frankfurter, from central bank reference rates",
    url: "https://frankfurter.dev/",
    licence: "Free to use",
    paidUse: "yes",
  },
  {
    what: "Country and coastline shapes",
    from: "Natural Earth",
    url: "https://www.naturalearthdata.com/",
    licence: "Public domain",
    paidUse: "yes",
  },
  {
    what: "Typefaces",
    from: "Bricolage Grotesque, Instrument Sans and DM Mono, through Google Fonts",
    url: "https://fonts.google.com/",
    licence: "SIL Open Font Licence 1.1",
    paidUse: "yes",
  },
];
