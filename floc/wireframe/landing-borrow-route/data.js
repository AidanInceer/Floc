// Three real Explore listings: a short one, the longest (8 stops, 4 countries) and one with two day outs.
export const TRIPS = [
  {
    key: "japan",
    title: "Tokyo to Osaka",
    countries: ["Japan"],
    iso: ["JP"],
    tone: "red",
    nights: 13,
    price: "£2,650.00",
    stops: [
      { name: "Tokyo", nights: 4, lat: 35.676, lng: 139.65 },
      { name: "Hakone", nights: 1, lat: 35.233, lng: 139.107, mode: "train", time: "1h 30" },
      { name: "Kyoto", nights: 4, lat: 35.011, lng: 135.768, mode: "train", time: "2h 20", out: { name: "Nara", mode: "train", what: "day trip" } },
      { name: "Hiroshima", nights: 2, lat: 34.385, lng: 132.455, mode: "train", time: "1h 40", out: { name: "Miyajima", mode: "ferry", what: "day trip" } },
      { name: "Osaka", nights: 2, lat: 34.694, lng: 135.502, mode: "train", time: "1h 30" },
    ],
  },
  {
    key: "cape",
    title: "Cape Town to Victoria Falls",
    countries: ["South Africa", "Namibia", "Botswana", "Zimbabwe"],
    iso: ["ZA", "NA", "BW", "ZW"],
    tone: "yellow",
    nights: 18,
    price: "£3,950.00",
    stops: [
      { name: "Cape Town", nights: 3, lat: -33.925, lng: 18.424, out: { name: "Cape Point", mode: "car", what: "day trip" } },
      { name: "Windhoek", nights: 1, lat: -22.56, lng: 17.066, mode: "flight", time: "2h" },
      { name: "Sossusvlei", nights: 2, lat: -24.733, lng: 15.293, mode: "car", time: "5h" },
      { name: "Swakopmund", nights: 2, lat: -22.678, lng: 14.527, mode: "car", time: "4h 30" },
      { name: "Etosha", nights: 3, lat: -19.18, lng: 15.917, mode: "car", time: "5h" },
      { name: "Okavango Delta", nights: 3, lat: -19.3, lng: 22.9, mode: "flight", time: "2h 30" },
      { name: "Chobe", nights: 2, lat: -17.817, lng: 25.15, mode: "flight", time: "1h" },
      { name: "Victoria Falls", nights: 2, lat: -17.932, lng: 25.831, mode: "car", time: "1h 30" },
    ],
  },
  {
    key: "hanoi",
    title: "Hanoi to Bangkok",
    countries: ["Vietnam", "Cambodia", "Thailand"],
    iso: ["VN", "KH", "TH"],
    tone: "red",
    nights: 16,
    price: "£2,150.00",
    stops: [
      { name: "Hanoi", nights: 2, lat: 21.028, lng: 105.854, out: { name: "Halong Bay", mode: "ferry", what: "day cruise" } },
      { name: "Hue", nights: 2, lat: 16.463, lng: 107.59, mode: "train", time: "13h, overnight" },
      { name: "Hoi An", nights: 3, lat: 15.88, lng: 108.338, mode: "car", time: "3h" },
      { name: "Ho Chi Minh City", nights: 2, lat: 10.776, lng: 106.7, mode: "flight", time: "1h 25" },
      { name: "Phnom Penh", nights: 2, lat: 11.556, lng: 104.928, mode: "car", time: "6h by bus" },
      { name: "Siem Reap", nights: 3, lat: 13.367, lng: 103.844, mode: "car", time: "6h by bus", out: { name: "Angkor Wat", mode: "car", what: "day trip" } },
      { name: "Bangkok", nights: 2, lat: 13.756, lng: 100.502, mode: "flight", time: "1h 10" },
    ],
  },
];

// Rule for the place tag: the first country, then "+n" for the rest. The full list is the tag's label.
export const placeWords = (countries) => (countries.length > 1 ? `${countries[0]} +${countries.length - 1}` : countries[0]);
export const nightsWords = (n) => `${n} ${n === 1 ? "night" : "nights"}`;

export const MODE_PATHS = {
  flight: ["M11.03 2.97C11.42 3.36 11.35 3.99 10.85 4.49L8.66 6.68L9.93 11.49L9.09 12.34L6.96 8.38L5.27 10.08L5.48 11.7L4.84 12.34L3.68 10.32L1.66 9.16L2.3 8.52L3.92 8.73L5.62 7.04L1.66 4.91L2.51 4.07L7.32 5.34L9.51 3.15C10.01 2.65 10.64 2.58 11.03 2.97Z"],
  train: ["M4.8 1.8h4.4A1.8 1.8 0 0 1 11 3.6v4.8a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 8.4V3.6a1.8 1.8 0 0 1 1.8-1.8Z", "M3 6.4h8M5 12.2l1-2M9 12.2l-1-2"],
  car: ["M2 9.4V7.2l1.3-3a1 1 0 0 1 .9-.6h5.6a1 1 0 0 1 .9.6l1.3 3v2.2H2ZM2 7.2h10", "M4.4 9.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM9.6 9.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"],
  ferry: ["M2.2 8.2h9.6l-1.4 3H3.6ZM4.2 8.2V5.4h5.6v2.8M7 5.4V2.6"],
};
