/**
 * What the privacy policy says Floc holds, who receives it and how long it is kept (#549). Kept as data so a test
 * can hold the list of companies to the services the code calls.
 */

export const DATA_HELD = [
  { what: "Account details: name, email address, and a one-way hash of your password or Google account identifier", why: "To provide and secure your account", ground: "Performance of a contract" },
  { what: "Sign-in records: the IP address and browser used for each sign-in", why: "To protect your account and prevent abuse", ground: "Legitimate interests" },
  { what: "Profile: display name, photograph, home currency, travel style, countries visited or planned, saved trips and lists, friends and groups", why: "To present your profile to the people you choose", ground: "Performance of a contract" },
  { what: "Trip content: dates, availability, places, itinerary, ideas and votes, expenses and balances, packing lists, notes and files", why: "To plan trips with your group", ground: "Performance of a contract" },
  { what: "Booking emails you forward to Floc, and the details extracted from them", why: "To add the booking to your trip", ground: "Performance of a contract" },
  { what: "Google Calendar, where connected: whether you are free or busy on each day only", why: "To complete your availability", ground: "Consent" },
  { what: "Guests using an invitation link: the name given, votes and availability", why: "To allow a response without an account", ground: "Legitimate interests" },
  { what: "Floc Pro: your plan, its dates, and a payment reference from Stripe, Apple or Google", why: "To provide Floc Pro and keep tax records", ground: "Performance of a contract and legal obligation" },
  { what: "Device push address, where you allow notifications", why: "To notify you of changes to your trips", ground: "Consent" },
  { what: "Correspondence you send to us", why: "To respond to you", ground: "Legitimate interests" },
] as const;

export const DATA_RECEIVERS = [
  { who: "Railway", job: "Website hosting and file storage", receives: "All data processed by Floc" },
  { who: "Turso", job: "Database hosting", receives: "All data processed by Floc, except files" },
  { who: "Resend", job: "Sending and receiving email", receives: "Your email address, the emails we send you, and booking emails you forward" },
  { who: "Stripe", job: "Payment processing on the website", receives: "Your name, email address, billing address and card details" },
  { who: "Apple and Google", job: "Payment processing in the app, and delivery of notifications", receives: "Your purchase, and the content of a notification" },
  { who: "Expo", job: "Routing notifications to Apple and Google", receives: "Your device push address and the content of a notification" },
  { who: "Google", job: "Sign-in with Google, and Google Calendar where connected", receives: "The fact that you signed in to Floc. We receive your name, email address, Google profile picture and free or busy times" },
  { who: "OpenStreetMap (Nominatim)", job: "Place search", receives: "The search terms entered, without your identity" },
  { who: "MET Norway", job: "Weather forecasts", receives: "The map position of a stop, without your identity" },
  { who: "Frankfurter", job: "Exchange rates", receives: "No personal data" },
] as const;

export const DATA_KEPT = [
  { what: "Account and profile", kept: "Until you delete your account" },
  { what: "Trips and their content", kept: "Until the trip or item is deleted. A deleted item is hidden immediately and can be permanently erased on request" },
  { what: "Files you remove", kept: "7 days in the trip's archive, then deleted" },
  { what: "Forwarded bookings not assigned to a trip", kept: "Removed from your list after 7 days and deleted after 30 days" },
  { what: "Sign-in records", kept: "Until you sign out or delete your account. A session expires 60 days after it was last used" },
  { what: "Payment records", kept: "For the period required by UK tax law, up to 6 years" },
  { what: "Correspondence", kept: "Up to 2 years" },
] as const;
