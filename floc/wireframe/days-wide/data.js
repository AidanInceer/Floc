export const TRIP = { name: "Portugal, late summer", start: "2026-12-24", end: "2026-12-31" };

export const PEOPLE = [
  { name: "Aidan", initial: "Ai", tone: 1 },
  { name: "Priya Raman", initial: "PR", tone: 2 },
  { name: "Sofia Alves", initial: "SA", tone: 4 },
  { name: "Tom Whitfield", initial: "TW", tone: 3 },
];

export const STOPS = [
  { place: "Lisbon", from: "2026-12-24", to: "2026-12-26", stay: "Casa do Bairro, Alfama", file: "Casa do Bairro booking.pdf", water: "river" },
  { place: "Lagos", from: "2026-12-27", to: "2026-12-31", stay: "Rua da Barroca flat", file: "Lagos flat confirmation.pdf", water: "sea" },
];

export const NOTES = {
  "2026-12-25": "Most places shut early on Christmas Day. Castelo is open until 13:00.",
  "2026-12-26": "Rossio trains run every 20 minutes. Buy a Viva Viagem card at the station.",
  "2026-12-30": "Free day. Tom wants to look at surf lessons.",
};

let next = 1;
const ev = (date, type, title, time, end, place, at, extra = {}) =>
  ({ id: next++, date, type, title, time, end, place, at, ...extra });

export function freshEvents() {
  next = 1;
  return [
    ev("2026-12-24", "transport", "Flight to Lisbon", "10:15", "12:45", "Lisbon airport", [38.7742, -9.1342], { mode: "flight", file: "TAP booking.pdf" }),
    ev("2026-12-24", "other", "Check in, Casa do Bairro", "15:00", "15:30", "Alfama", [38.7115, -9.1300]),
    ev("2026-12-24", "food", "Dinner in Alfama", "19:30", "21:30", "Taberna da Rua das Flores", [38.7108, -9.1435]),
    ev("2026-12-25", "other", "Christmas Day", "", "", "Lisbon", [38.7139, -9.1394], { allDay: true }),
    ev("2026-12-25", "activity", "Tram 28", "08:30", "10:00", "Martim Moniz", [38.7160, -9.1355]),
    ev("2026-12-25", "food", "Pastéis at Manteigaria", "10:15", "10:45", "Chiado", [38.7106, -9.1428]),
    ev("2026-12-25", "activity", "Castelo de São Jorge", "11:00", "13:00", "Castelo", [38.7139, -9.1334]),
    ev("2026-12-25", "food", "Lunch at Time Out Market", "13:30", "15:00", "Cais do Sodré", [38.7071, -9.1458]),
    ev("2026-12-25", "activity", "Fado at Clube de Fado", "21:00", "23:00", "Alfama", [38.7105, -9.1300]),
    ev("2026-12-26", "transport", "Train to Sintra", "09:10", "09:50", "Rossio station", [38.7142, -9.1410], { mode: "train" }),
    ev("2026-12-26", "activity", "Pena Palace", "10:30", "13:00", "Sintra", [38.7876, -9.3906], { file: "Pena tickets.pdf" }),
    ev("2026-12-26", "food", "Lunch in Sintra", "13:30", "14:45", "Tascantiga", [38.7975, -9.3905]),
    ev("2026-12-26", "activity", "Sunset at Senhora do Monte", "17:00", "18:00", "Graça", [38.7193, -9.1328]),
    ev("2026-12-26", "food", "Dinner at Cervejaria Ramiro", "20:00", "22:00", "Intendente", [38.7206, -9.1356]),
    ev("2026-12-27", "transport", "Train to Lagos", "09:05", "13:10", "Lisboa Oriente", [37.1060, -8.6740], { mode: "train", file: "CP tickets.pdf" }),
    ev("2026-12-27", "other", "Check in, Lagos flat", "15:00", "15:30", "Rua da Barroca", [37.1010, -8.6735]),
    ev("2026-12-27", "food", "Dinner on the marina", "19:30", "21:00", "Marina de Lagos", [37.1050, -8.6720]),
    ev("2026-12-28", "transport", "Car hire", "", "", "Lagos", [37.1010, -8.6735], { allDay: true, mode: "car", file: "Car hire voucher.pdf" }),
    ev("2026-12-28", "activity", "Kayak at Ponta da Piedade", "10:00", "12:30", "Ponta da Piedade", [37.0810, -8.6690], { file: "Kayak booking.pdf" }),
    ev("2026-12-28", "activity", "Beach, Praia do Camilo", "14:00", "17:30", "Praia do Camilo", [37.0860, -8.6680]),
    ev("2026-12-29", "activity", "Benagil boat trip", "11:00", "13:00", "Benagil", [37.0870, -8.4260]),
    ev("2026-12-29", "food", "Seafood lunch in Ferragudo", "13:30", "15:00", "Ferragudo", [37.1240, -8.5200]),
    ev("2026-12-30", "activity", "Beach day, Meia Praia", "", "", "Meia Praia", [37.1150, -8.6600], { allDay: true }),
    ev("2026-12-31", "transport", "Car to Faro airport", "08:30", "09:45", "Lagos", [37.1010, -8.6735], { mode: "car" }),
    ev("2026-12-31", "transport", "Flight home", "11:40", "14:10", "Faro airport", [37.0144, -7.9659], { mode: "flight" }),
  ];
}
