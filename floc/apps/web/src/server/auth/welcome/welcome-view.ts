import "server-only";

import { headers } from "next/headers";
import { guessCurrency } from "@floc/core/money/local-currency";
import { airportLabel, chosenAirport, countryAirports, loadAirports } from "@floc/core/money/estimate/guide/airports/airports";

import type { WelcomeProps } from "@/components/onboarding/welcome/welcome-modal";
import type { StartPerson } from "@/components/onboarding/start/start-who";
import { seedWelcomeCurrency, welcomeFor, type WelcomeState } from "@/server/auth/welcome/welcome";

export async function welcomeView(
  viewer: { id: string; name: string },
  people: StartPerson[],
  invited: string | null = null,
  alreadyRead?: WelcomeState,
): Promise<WelcomeProps | null> {
  const state = alreadyRead ?? (await welcomeFor(viewer.id));
  if (!state.due) return null;
  const request = await headers();
  const country = request.get("cf-ipcountry") ?? request.get("x-vercel-ip-country");
  const guess = guessCurrency({ country, acceptLanguage: request.get("accept-language") });
  await seedWelcomeCurrency(viewer.id, guess);
  const [airport, all] = await Promise.all([chosenAirport(state.answers.homeAirport ?? null), loadAirports()]);
  return {
    me: viewer.name,
    currency: state.currency === "GBP" ? guess : state.currency,
    answers: { ...state.answers, airport },
    picks: countryAirports(all, country).map((a) => ({ code: a.code, label: airportLabel(a) })),
    invited,
    people,
  };
}

export function startPeople(lists: { id: string; name: string }[][]): StartPerson[] {
  const seen = new Map<string, StartPerson>();
  for (const person of lists.flat()) if (!seen.has(person.id)) seen.set(person.id, { id: person.id, name: person.name });
  return [...seen.values()];
}
