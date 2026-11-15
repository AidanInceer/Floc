/**
 * What the privacy policy says Floc holds, who receives it and how long it is kept (#549). Kept as data so a test
 * can hold the list of companies to the services the code calls.
 */

export const DATA_HELD = [
  { what: "Your account: name, email, and a scrambled password or your Google account id", why: "To sign you in", ground: "Contract" },
  { what: "Each sign-in: the internet address and browser it came from", why: "To keep your account safe and limit abuse", ground: "Legitimate interests" },
  { what: "Your profile: display name, face, home currency, travel style, countries you have been to or want to go to, saved trips and lists, friends and groups", why: "To show you to the people you choose", ground: "Contract" },
  { what: "Your trips: dates, the days you can make, places, days and events, ideas and votes, expenses and who owes who, packing, notes and files", why: "To plan the trip with your group", ground: "Contract" },
  { what: "Booking emails you forward to Floc, and what Floc reads from them", why: "To put the booking on your trip", ground: "Contract" },
  { what: "Google Calendar, if you connect it: only whether you are free or busy on each day", why: "To fill in the days you can make", ground: "Consent" },
  { what: "A guest on an invite link: the name they give, their votes and their days", why: "To let them answer without an account", ground: "Legitimate interests" },
  { what: "Floc Pro: your plan, its dates, and a payment reference from Stripe, Apple or Google", why: "To give you Pro and keep tax records", ground: "Contract and legal duty" },
  { what: "Your phone's push address, if you allow notifications", why: "To tell you when your trip changes", ground: "Consent" },
  { what: "Messages you send us", why: "To answer you", ground: "Legitimate interests" },
] as const;

export const DATA_RECEIVERS = [
  { who: "Railway", job: "Runs the website and stores files", receives: "Everything Floc holds passes through it" },
  { who: "Turso", job: "The database", receives: "Everything except files" },
  { who: "Resend", job: "Sends and receives email", receives: "Your email address, the emails Floc sends you, and booking emails you forward" },
  { who: "Stripe", job: "Takes payment on the website", receives: "Your name, email, billing address and card details" },
  { who: "Apple and Google", job: "Take payment in the phone app, and deliver notifications", receives: "Your purchase, and the text of a notification" },
  { who: "Expo", job: "Passes notifications to Apple and Google", receives: "Your phone's push address and the text of a notification" },
  { who: "Google", job: "Sign in with Google, and Google Calendar if you connect it", receives: "That you signed in to Floc. Floc receives your name, email, Google picture and free or busy times" },
  { who: "OpenStreetMap (Nominatim)", job: "Finds a place when you search for one", receives: "The words you search for, not who you are" },
  { who: "MET Norway", job: "The weather forecast", receives: "The map position of a stop, not who you are" },
  { who: "Frankfurter", job: "Exchange rates", receives: "Nothing about you" },
] as const;

export const DATA_KEPT = [
  { what: "Your account and profile", kept: "Until you delete your account" },
  { what: "A trip and what is on it", kept: "Until the trip or the item is deleted. A deleted item is hidden at once and can be removed for good on request" },
  { what: "A file you remove", kept: "7 days in the trip's archive, then deleted" },
  { what: "A forwarded booking with no trip chosen", kept: "Off your list after 7 days, deleted after 30" },
  { what: "Sign-in records", kept: "Until you sign out or delete your account. A sign-in stops working 60 days after you last used it" },
  { what: "Payment records", kept: "As long as UK tax law requires, which is up to 6 years" },
  { what: "Messages you send us", kept: "Up to 2 years" },
] as const;
