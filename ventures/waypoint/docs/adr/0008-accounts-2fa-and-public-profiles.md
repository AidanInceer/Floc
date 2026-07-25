# 8. Accounts, 2FA, and the public traveller profile

Date: 2026-07-25

## Status

Proposed

## Context

Two requirements pull against each other.

**Frictionless joining.** The product spreads by one person sending a link to a
group chat. If voting on a destination requires an account, an app install and
an email confirmation, most of the group never votes and the trip dies in the
chat — which is the exact failure the product exists to fix.

**Real accounts with 2FA.** Trips contain home addresses while away, flight
numbers, passport-adjacent details, booking references, door codes, and money
balances. Account takeover here is genuinely harmful, and the brief asks for
two-factor auth.

Separately, the brief wants a Duolingo-style social profile: see where friends
have been, browse public trips for inspiration. That introduces a third tension —
a travel app that publishes where you are, and when your house is empty.

## Decision

### Three tiers of participation

1. **Link guest** — opens an invite link, can vote, mark availability, and read
   the plan. Identified by a name they type and a signed link cookie. No
   password, no email required. Cannot see money detail, door codes, addresses,
   or notes marked sensitive.
2. **Member** — email or passkey account. Full trip access, can add costs, book,
   and be owed money.
3. **Trip owner** — the creator plus anyone they promote. Can remove people,
   lock decisions, delete the trip.

A link guest is prompted to upgrade at the exact moment they hit a wall
("Mira wants to pay you back — add an email so she can"), not at the door.

### Authentication

- **Passkeys as the primary credential**, email one-time codes as fallback. This
  is 2FA-by-construction (device + biometric) without a password to phish.
- **Password + TOTP** offered for users who want it; SMS 2FA is not offered
  (SIM-swap risk on an app that also shows your travel dates).
- **Step-up authentication** — re-verify before viewing or changing money
  details, door codes, or ownership. Session length is generous; sensitive
  actions are not.

### The public profile

- **Private by default, at every level.** A trip is private; a profile is
  private; nothing is public until an explicit publish action.
- **Publishing is per-trip and always retrospective for locations.** You can
  publish a past trip freely. You cannot publish live location or future dates
  for a home address — the app will not help you advertise an empty house.
- **Publishing strips by default**: money, notes marked private, other people's
  names (they must each consent to appear), door codes, booking references.
- What a published trip *does* carry: the route line, the stops, the day
  headlines, the photos and notes the author chose to include, and a
  **"copy this trip"** button that seeds a new trip's ideas and route. That copy
  action is the growth loop and the reason the profile exists.
- Following is one-way and does not grant access to anything unpublished.

## Consequences

- Guest access means the permission model is per-trip, per-role, per-field from
  the start. This is real work and cannot be bolted on.
- Passkey-first reduces support burden (no password resets) but needs a solid
  recovery path — account recovery becomes the weakest link and must be designed
  deliberately.
- "Private by default" costs viral reach compared with a public-first social app.
  Accepted: a travel app that leaks presence is a safety problem, and one
  incident would end the product.
- GDPR: trips contain other people's personal data entered by someone else.
  Need a lawful basis, an export path, and a deletion path that survives shared
  ownership (deleting your account must not delete the group's trip).
