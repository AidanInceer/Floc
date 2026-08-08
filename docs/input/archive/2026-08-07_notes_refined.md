# Refined: notes.md
_Source: docs/input/raw/notes.md_
_Refined: 2026-08-07_

## Doc updates

### docs/backlog/backlog.html — Near-term list
Add a near-term polish item for the invite share link:

> Invite share link should surface the trip name — e.g. "Join my 'Barcelona trip'" — rather than a bare URL.

### docs/backlog/backlog.html — Free track table
Add two new rows to the Free track ideas table (position is open — social features are lower priority than core planning but clearly in scope):

**New row: Add friends from profile (friends-of-friends)**
When browsing a friend's public profile, the user can send a friend request to any of that friend's connections. Solves the cold-start problem: you meet someone on a trip and can find them through a mutual friend rather than needing their handle.

**New row: Add friends to a trip**
From the trip creation flow or the trip overview, add existing friends directly to the trip. This sends them an in-app invite notification (shown when they next open the site). Push notification delivery is a follow-on; the first cut is a pending-invite badge or alert on login.

## Backlog updates

### New issue: Friends-of-friends discovery on public profiles
**Body:**
When viewing a friend's public profile, show their friend list (or a subset of it) and allow the viewer to send friend requests from there.

**Why:** Reduces friction for finding people you know through mutual connections — common after group trips.

**Acceptance criteria:**
- Public profiles show a friends list (or "mutual friends" count at minimum).
- A "Add friend" action is available per listed friend.
- A friend request is sent; recipient sees a notification or badge on next visit.
- Privacy: only visible if the profile owner has set their profile to public.

### New issue: Add friends to a trip (with invite notification)
**Body:**
From trip creation and from the trip overview page, allow the trip admin (or any member, TBD) to select from their existing friends list and add them to the trip. This triggers an in-app invite notification shown when the invitee next opens the site.

**Why:** Right now adding someone requires sharing a link manually. Friends should be addable with one tap.

**Acceptance criteria:**
- Friend picker available at trip creation step and on the overview page.
- Selected friends receive an invite (pending state until accepted).
- An in-app notification or badge appears for the invitee on next site load.
- Push notifications are explicitly out of scope for this issue.

### New issue: Named invite share link
**Body:**
When sharing a trip invite link, the link or the landing page should surface the trip name — e.g. "You've been invited to join 'Barcelona 2027'" — rather than presenting a bare or opaque URL.

**Why:** A named link builds trust (recipient knows what they're joining) and improves conversion from invite to signup.

**Acceptance criteria:**
- The invite URL resolves to a page that shows the trip name and who sent the invite.
- The link itself may remain opaque (e.g. `/invite/abc123`); the landing page carries the context.
- Works for both logged-in and logged-out recipients.

## Out of scope
- Push notification delivery (noted in the raw notes as "can be thought about later") — not a docs or backlog item yet; flagged for future addition when the notifications infrastructure is being scoped.
