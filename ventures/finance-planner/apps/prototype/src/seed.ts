// Default seed data, lifted from the source Excel model
// (Hertford_Mill_Financial_Dashboard). Used as the starting point; everything is
// editable in-app and stored in localStorage.

import type { AppState } from "./domain/types";

let n = 0;
const id = () => `s${n++}`;

export const seed: AppState = {
  onboarded: false,
  profile: {
    name: "Aidan",
    risk: "balanced",
    emergencyMonths: 6,
    bufferFloor: 2500,
  },
  accounts: [
    { id: id(), institution: "Barclays", name: "Current", type: "current", balance: 928, spendable: true, ringfenced: false },
    { id: id(), institution: "Barclays", name: "Savings (emergency)", type: "savings", balance: 5000, spendable: false, ringfenced: true },
    { id: id(), institution: "Barclays", name: "Parental gift", type: "savings", balance: 50000, spendable: false, ringfenced: true },
    { id: id(), institution: "Monzo", name: "Current + savings", type: "current", balance: 245, spendable: true, ringfenced: false },
    { id: id(), institution: "Zopa", name: "Savings", type: "savings", balance: 1846, spendable: true, ringfenced: false },
    { id: id(), institution: "Revolut", name: "Savings", type: "savings", balance: 1856, spendable: true, ringfenced: false },
    { id: id(), institution: "Coinbase", name: "Crypto", type: "crypto", balance: 1219, spendable: true, ringfenced: false },
    { id: id(), institution: "Barclays", name: "Credit card", type: "credit", balance: -750, spendable: true, ringfenced: false },
    { id: id(), institution: "ISA", name: "Cash ISA", type: "isa_cash", balance: 41000, spendable: false, ringfenced: false },
    { id: id(), institution: "ISA", name: "Stocks & shares ISA", type: "isa_stocks", balance: 79000, spendable: false, ringfenced: false },
  ],
  plan: {
    startMonth: 7, // August (0-based)
    startYear: 2026,
    horizon: 12,

    takeHome: 3979,
    bonusNet: 4600.8,
    bonusMonth: 9, // Apr-27

    rent: 1500,
    completionMonth: 5, // Dec-26 — rent stops, housing starts
    housingMonthly: 1156.93, // your share of all housing costs

    cardSpend: 750,

    isaMonthly: 750,
    isaStartMonth: 6, // Jan-27

    bufferCeiling: 12500,

    oneOffs: [
      { id: id(), month: 1, amount: 800, label: "Setup / misc" },
      { id: id(), month: 2, amount: 1650, label: "Moving costs" },
      { id: id(), month: 3, amount: 3500, label: "Furniture deposit" },
      { id: id(), month: 4, amount: 400, label: "Bits & pieces" },
      { id: id(), month: 5, amount: 250, label: "Completion extras" },
      { id: id(), month: 7, amount: 2000, label: "Furniture" },
      { id: id(), month: 9, amount: 2500, label: "Furniture" },
    ],
  },
};
