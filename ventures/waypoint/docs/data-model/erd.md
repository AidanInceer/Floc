# Waypoint v1 — physical data model

Source of truth for the decisions is
[Core data model and SQLite schema](../../../../.scratch/waypoint-v1/issues/04-core-data-model-and-schema.md).
This diagram is documentation of that decision, not schema code — no
migrations/DDL land until the whole `waypoint-v1` map is walked.

Every table carries `id` (PK), `created_at`, `deleted_at`, `last_modified_at`
— omitted from the entity blocks below to keep them readable; assume all four
on every entity.

`user` / `account` / `session` are Better Auth's own tables, used unmodified
— shown here only as the `user` anchor that our tables extend.

```mermaid
erDiagram
    USER ||--o| USER_PROFILE : "has"
    USER ||--o{ FRIENDSHIP : "requests (user_id)"
    USER ||--o{ FRIENDSHIP : "receives (friend_id)"
    USER ||--o{ TRIP : "creates (created_by)"
    USER ||--o{ TRIP_MEMBERSHIP : "belongs to"
    TRIP ||--o{ TRIP_MEMBERSHIP : "has members"
    TRIP ||--o{ IDEA : "has"
    USER ||--o{ IDEA : "creates (created_by)"
    IDEA ||--o{ IDEA_VOTE : "receives"
    USER ||--o{ IDEA_VOTE : "casts"
    TRIP ||--o{ AVAILABILITY : "has"
    USER ||--o{ AVAILABILITY : "reports"
    TRIP ||--o{ DAY : "has"
    DAY ||--o{ DAY_EVENT : "has"
    PLACE ||--o{ DAY : "is overnight place for (overnight_place_id)"
    PLACE ||--o{ DAY_EVENT : "is location for (place_id)"
    TRIP ||--o{ EXPENSE : "has"
    DAY ||--o{ EXPENSE : "occurs on (day_id, nullable)"
    USER ||--o{ EXPENSE : "creates (created_by)"
    EXPENSE ||--o{ EXPENSE_SPLIT : "splits into"
    USER ||--o{ EXPENSE_SPLIT : "owes"
    TRIP ||--o{ NOTE : "has"
    USER ||--o{ NOTE : "creates (created_by)"

    USER {
        string id PK
        string email
        string name
        string image
    }

    USER_PROFILE {
        string user_id PK "FK -> USER.id"
        json vibe_preferences
    }

    FRIENDSHIP {
        int id PK
        string user_id FK "requester -> USER.id"
        string friend_id FK "recipient -> USER.id"
        string status "pending | accepted"
    }

    TRIP {
        int id PK
        string name
        date start_date "nullable"
        date end_date "nullable"
        string created_by FK "-> USER.id"
        datetime archived_at "nullable, admin-only"
    }

    TRIP_MEMBERSHIP {
        int trip_id PK,FK "-> TRIP.id"
        string user_id PK,FK "-> USER.id"
        string role "admin | member"
    }

    IDEA {
        int id PK
        int trip_id FK "-> TRIP.id"
        string created_by FK "-> USER.id"
        text note
        datetime pinned_at "nullable — pinned to the top of the board, group-wide"
    }

    IDEA_VOTE {
        int id PK
        int idea_id FK "-> IDEA.id"
        string user_id FK "-> USER.id"
        string value "up | dont_mind | down"
    }

    AVAILABILITY {
        int id PK
        int trip_id FK "-> TRIP.id"
        string user_id FK "-> USER.id"
        date date
        bool available
    }

    DAY {
        int id PK
        int trip_id FK "-> TRIP.id"
        date date
        int overnight_place_id FK "-> PLACE.id, nullable"
    }

    DAY_EVENT {
        int id PK
        int day_id FK "-> DAY.id"
        int order_index
        string type "activity | transport"
        int place_id FK "-> PLACE.id, nullable"
        string transport_type "flight|train|car|ferry|other, nullable"
        time time "nullable"
        text note
    }

    PLACE {
        int id PK
        string mapbox_id
        string name
        float lat
        float lng
    }

    EXPENSE {
        int id PK
        int trip_id FK "-> TRIP.id"
        int day_id FK "-> DAY.id, nullable"
        string created_by FK "-> USER.id"
        string description
        int amount_minor
        string currency "EUR | USD | GBP"
        string split_type "even|exact|percentage|shares"
        text notes
    }

    EXPENSE_SPLIT {
        int id PK
        int expense_id FK "-> EXPENSE.id"
        string user_id FK "-> USER.id"
        int owed_amount_minor "snapshotted at creation"
    }

    NOTE {
        int id PK
        int trip_id FK "-> TRIP.id"
        string created_by FK "-> USER.id"
        string scope "trip|day|day_event|idea|expense"
        int scope_id "not a real FK — polymorphic, app-enforced"
        text body
    }
```

## Relationship cardinalities (plain-English index)

| From | To | Cardinality | Notes |
|---|---|---|---|
| `user` | `user_profile` | 1–0..1 | optional, extends Better Auth's user |
| `user` | `friendship` | 1–M (×2) | one FK as requester, one as recipient |
| `user` | `trip` | 1–M | `trip.created_by` |
| `trip` ↔ `user` | M–M | via `trip_membership` (composite PK) |
| `trip` | `idea` | 1–M | `pinned_at` floats a note above the board's sort (v0.2 ticket 09) |
| `idea` | `idea_vote` | 1–M | one vote per (idea, user) in practice, not DB-enforced |
| `trip` | `availability` | 1–M | one row per (trip, user, date) |
| `trip` | `day` | 1–M | |
| `day` | `day_event` | 1–M | ordered by `order_index` |
| `place` | `day` | 1–M | via `overnight_place_id`, nullable |
| `place` | `day_event` | 1–M | via `place_id`, nullable |
| `trip` | `expense` | 1–M | |
| `day` | `expense` | 1–M | nullable — an expense need not be day-scoped |
| `expense` | `expense_split` | 1–M | |
| `trip` | `note` | 1–M | `scope`/`scope_id` further narrows within the trip |

A **"stop"** (e.g. "3 nights in Rome") is not a table — it's derived by
grouping consecutive `day` rows that share the same `overnight_place_id`.

`note` is the **discussion thread** on anything that has one. In use today for
`scope: "idea"` (why this one, or why not) and `scope: "day_event"` (whatever the
group needs to know about that ferry), read scoped by `(trip_id, scope,
scope_id)` off `note_scope_idx`. One table rather than `idea_comment` +
`day_event_comment` + …: a note is the same object with the same author-or-admin
delete rule wherever it hangs.

`day` deliberately has **no `notes` column**. It had one; nobody could say what
belonged in it, since the thing a group annotates is an event rather than a
whole day. Event details live on `day_event.note`, the conversation in `note`.
