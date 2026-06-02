# TeamPulse
Case tracker for the department.

Runs in **demo mode** (in-memory sample data) until Firebase is configured, so
`npm run dev` works with zero setup. Add a `.env` to switch to real Firebase.

## Setup (free — Spark plan)
1. `npm install`
2. Create a Firebase project. Enable **Authentication → Email/Password** and
   **Firestore**. You do **not** need Storage or Cloud Functions (keeps it free).
3. Copy `.env.example` → `.env` and fill in the web-app config. The presence of
   `VITE_FIREBASE_API_KEY` switches off demo mode automatically.
4. `firebase deploy --only firestore:rules`
5. `npm run dev`

## Authentication — Plan A
Coordinators have individual accounts; **all members share one login**. Members
are still individual *people* (docs created on the Schema page) — they just
don't each have a credential.

**Bootstrap by hand in the Firebase console (rules never solve bootstrap):**
1. **First coordinator** — add an Auth user (email + password), copy its UID,
   then create `departments/main/users/{UID}` =
   `{ name, role: "coordinator", teamId: "", groupId: "", active: true }`.
2. **Shared member account** — add a second Auth user (e.g.
   `medlem@dittlag.internal`), copy its UID, then create
   `departments/main/users/{UID}` =
   `{ name: "Medlemmar", role: "member", active: true, system: true }`.
   The `system: true` flag keeps this login out of the people lists
   (schema/absence). Give this email + password to all members.

**After bootstrap:** a logged-in coordinator can create more coordinator
accounts in-app via **Konton** in the navbar (uses a temporary secondary
Firebase app so it doesn't log them out). Resets / removed people are done by
deleting or deactivating the `users/{...}` doc — the app gate requires a profile
doc, so that revokes access without touching Auth.

## Security posture
Broad read for any signed-in member; coordinator-only writes except: team case
counters (any signed-in member, since members share a login) and absence (open
to all). `role` on the user doc is the trust anchor; `users/*` is
coordinator-write-only. See `firestore.rules`.

## Tests
`npm test` — covers the ISO week/rotation logic.
