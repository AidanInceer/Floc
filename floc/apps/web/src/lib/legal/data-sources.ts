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
    from: "MET Norway (the Norwegian Meteorological Institute)",
    url: "https://api.met.no/",
    licence: "CC BY 4.0",
    paidUse: "yes",
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
