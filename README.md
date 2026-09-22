# Feedants Competition Details — Full-Stack Assignment

A production-style, full-stack implementation of the Feedants "Competition Details" module: real backend business logic, concurrency-safe registration, a server-side payment state machine, real file submissions, referrals, a bilingual UI (ENG/हिंदी), and a mobile-first interface closely matching the reference screenshot.

> **Platform note (important).** This build runs on the hosting environment's managed full-stack platform: **React + Vite frontend, Convex backend + database** (auth, server functions, document DB, file storage, reactive subscriptions). React Native/Express/Mongo are not runnable in this sandbox, so the assignment's architecture was implemented **1:1 on the platform equivalents**:
>
> | Assignment requirement | Implementation here |
> |---|---|
> | React Native + Expo screens | React (web) rendered in a fixed 430px mobile viewport ("phone frame") — same component tree, same UX |
> | Node/Express REST API | Convex server functions exposed through the same `POST /api/competitions/:id/register`-style contract (see §API) |
> | MongoDB + Mongoose | Convex document DB with the same collections and indexes (see §Indexes) |
> | Mongo transactions / atomic updates | Convex serializable transactions with optimistic concurrency control (see §Concurrency) |
> | JWT auth + bcrypt | Convex Auth (OTP-based sessions, hashed credentials, httpOnly cookie storage) |
> | Razorpay | Provider abstraction with a clearly-labeled development simulation (see §Payments) |
>
> Every functional requirement — dynamic data, registration state, capacity safety, payment states, submissions, referrals, i18n, lifecycle states — is real backend state. Nothing is mocked in the UI.

---

## 1. Project Overview

The screen recreates the Feedants **Competition Details** reference: top bar with back button and ENG/हिंदी toggle, title with category/Multi-Win badges and "Winners get certificate", prize pool / entry fee / spots progress, judge card with intro video, registration countdown, Important Dates, previous-winners carousel, About/Judging/Rules tabs, rewards list, disclaimer, payment/refund info, referral card, testimonials row, ad placeholder, sticky "Upload Submission" CTA and a bottom tab bar.

**Every value on that screen is fetched from the database.** The React components contain zero competition content.

## 2. Features

- Competition detail fed entirely by `competitions.get` (detail + `userState` in one response)
- Real per-second countdown computed from backend timestamps; UI re-derives state at zero
- Concurrency-safe registration (capacity can never be exceeded, duplicates impossible)
- Payment order state machine (PENDING → PAID / FAILED) with a pluggable provider
- Video submissions with real file upload, type/size validation, edit-before-review
- Referral codes with self-referral and duplicate-reward prevention
- Functional ENG/हिंदী switch persisted locally and on the user profile
- 12 CTA/UI states driven by a single pure state machine (`deriveCta`)
- Loading skeletons, error and empty states throughout
- Role-based admin authorization (server-enforced)
- Seed script (idempotent, upsert-by-slug)

## 3. Tech Stack

React 19 · TypeScript · Vite · Tailwind v4 · shadcn/ui · Framer Motion · Convex (backend, DB, auth, storage) · Bun (runtime/tooling) · bun:test

## 4. Architecture

```
React components (src/pages, src/components)
        ↓  useApi* hooks / useMutation            ← envelope unwrapping in ONE place
Convex public functions (src/convex/*.ts)         ← "route/controller" layer: args validation + envelope
Service layer (src/convex/lib/*.ts)               ← business rules: lifecycle, registration, serialization
Data (Convex tables) + generated types            ← schema-validated documents with indexes
        ↓
JSON envelope { success, data | error } → React
```

Shared pure domain logic (`src/lib/competition-lifecycle.ts`) is imported by **both** backend services and the frontend. The backend remains the single source of truth; the frontend uses the same functions only to render the state the API returned.

- `src/convex/lib/errors.ts` — typed `AppError` codes (`COMPETITION_FULL`, `ALREADY_REGISTERED`, …); internal errors normalize to a generic message, never stack traces
- `src/convex/lib/api.ts` — `ok()` / `fail()` envelope helpers (assignment §39 contract)
- `src/convex/lib/auth.ts` — `requireUser` / `requireAdmin` guards
- `src/convex/lib/competitions.ts` — serialization (`remainingSpots`, derived `status`, friendly shape), lookup by id-or-slug, rewards-vs-prize-pool validation
- `src/convex/lib/registrations.ts` — the concurrency-safe registration core

## 5. Folder Structure

```
src/
  components/
    competition/        # PrizeCards, JudgeCard, CountdownBanner, ImportantDates,
                        # WinnerCarousel, CompetitionTabs, RewardsList, InfoCards,
                        # Video/Payment/Submission/Referral dialogs
    mobile/             # PhoneFrame/StatusBar, TopBar+LanguageSwitcher, BottomNav
    ui/                 # shadcn primitives
    RequireAuth.tsx
  convex/               # backend ("server/")
    lib/                # services: auth, api, errors, competitions, registrations
    auth/               # auth provider (email OTP)
    competitions.ts registrations.ts submissions.ts payments.ts
    referrals.ts users.ts admin.ts seed.ts schema.ts
  lib/
    competition-lifecycle.ts   # shared pure domain logic (+ tests)
    api-client.ts              # centralized envelope/error client
    i18n.ts  format.ts         # dictionaries, INR/IST/countdown helpers (+ tests)
  pages/
    Landing.tsx  Auth.tsx  NotFound.tsx
    app/                # CompetitionDetail, CompetitionsList, Home, Explore, Profile
  store/language.tsx    # i18n provider with persistence
```

## 6. Database Models

- **users** — name, email, image, role (`admin|user|member`), phone, preferredLanguage, referralCode
- **competitions** — title(+HINDI), category, tags, prizePool, entryFee, maxParticipants, currentParticipants, registrationStart/End, submissionStart/End, resultDate, judge{name, designation, experience, avatarUrl?, introVideoUrl?}, description, judgingParameters[{name, weight}], rules[], eligibility[], rewards[{position, label, amount}], disclaimer, refundPolicy, paymentProvider, certificateEnabled, multiWin, previousWinners[], referralReward, referralEnabled, languageSupport, manualStatusOverride?
- **competitionRegistrations** — userId, competitionId, status (REGISTERED|CANCELLED|COMPLETED), paymentStatus (PENDING|PAID|FAILED|REFUNDED), registeredAt, paymentReference?, submissionStatus?, referralCodeUsed?
- **submissions** — userId, competitionId, title, description?, fileId, fileName, fileType, fileSize, status (DRAFT|SUBMITTED|UNDER_REVIEW|REJECTED), submittedAt
- **paymentOrders** — userId, competitionId, registrationId, provider, providerOrderId, amount, currency, status, simulated, createdAt, completedAt?, failureReason?
- **referrals** — referrerId, referredUserId, referralCode, status (PENDING|COMPLETED|REWARDED), rewardAmount, createdAt, rewardedAt?

## 7. API Documentation

All functions return the standard envelope; errors carry machine-readable codes:

```
{ "success": true,  "data": ..., "message": "..." }
{ "success": false, "error": { "code": "COMPETITION_FULL", "message": "Competition is full." } }
```

**Competitions** (`competitions.ts`)
| Endpoint | Function | Notes |
|---|---|---|
| `GET /api/competitions` | `competitions.list` | derived status at read time, excludes DRAFT |
| `GET /api/competitions/:id` | `competitions.get` | `{ competition, userState, rewardsValidation }` |
| `GET /api/competitions/:id/status` | `competitions.status` | lightweight poll for countdown expiry |
| `GET /api/competitions/:id/winners` | `competitions.winners` | carousel data |

**Registration** (`registrations.ts`)
| Endpoint | Function | Errors |
|---|---|---|
| `POST /api/competitions/:id/register` | `registrations.register` | `COMPETITION_FULL`, `ALREADY_REGISTERED`, `REGISTRATION_CLOSED`, `CONFLICT` (cancelled) |
| `GET /api/competitions/:id/registration-status` | `registrations.registrationStatus` | |
| `DELETE /api/competitions/:id/register` | `registrations.cancel` | frees the spot atomically |

**Submissions** (`submissions.ts`)
| Endpoint | Function | Errors |
|---|---|---|
| `POST /api/competitions/:id/submission` | `submissions.upsert` | `REGISTRATION_REQUIRED`, `PAYMENT_REQUIRED`, `SUBMISSION_WINDOW_CLOSED/NOT_OPEN`, `INVALID_FILE`, `ALREADY_SUBMITTED` (locked) |
| `GET /api/competitions/:id/submission` | `submissions.get` | |
| (upload URL) | `submissions.generateUploadUrl` | short-lived storage upload URL |

**Payments** (`payments.ts`)
| Endpoint | Function | Notes |
|---|---|---|
| `POST /api/payments/create-order` | `payments.createOrder` | reuses a PENDING order; `REGISTRATION_REQUIRED` if unregistered |
| (confirm) | `payments.confirmSimulated` | dev gateway callback; transitions order + registration server-side |
| `GET /api/payments/orders` | `payments.myOrders` | user's recent orders |

**Referrals** (`referrals.ts`) — `referrals.generate` (idempotent code), `referrals.me` (code + URL + stats), `referrals.capture` (signup attribution; `SELF_REFERRAL` blocked, duplicates no-op).

**Users** (`users.ts`) — `users.currentUser` (`GET /api/auth/me` equivalent), `users.updateMe` (`PUT /api/users/me`: name, phone, preferredLanguage), `users.adminListUsers` (admin-only).

**Admin** (`admin.ts`) — `admin.createCompetition` / `updateCompetition` / `deleteCompetition` (soft-cancel), all behind `requireAdmin`.

## 8. Authentication

Auth is Convex Auth (email OTP + anonymous guest). Credentials are hashed and sessions stored in httpOnly cookies by the platform — the assignment's JWT-in-SecureStore goal (never localStorage) maps to this cookie model. `RequireAuth` protects all `/app/*` routes and preserves the intended path via `?returnTo=…`. Server-side, every protected function calls `requireUser(ctx)` / `requireAdmin(ctx)`; the UI's "Login to Register" CTA routes to `/auth` with the competition path as the return target.

Demo accounts (create via the email-OTP flow, then seed grants roles):
- `admin@feedants.local` → role `admin`
- `demo@feedants.local` → role `user`

## 9. Registration Flow

1. CTA pressed → `registrations.register({ idOrSlug })`
2. `registerUserAtomically` runs in **one serializable transaction**: lifecycle validation (dates, capacity, cancelled) → duplicate check on the `(userId, competitionId)` index → conditional capacity check → participant increment + registration insert, committed together
3. Paid competitions start with `paymentStatus: PENDING`; the payment dialog creates an order and the backend flips it to `PAID`/`FAILED`
4. All subscribed clients (list, detail, status) update instantly via reactive queries — "invalidate after mutation" is structural here

## 10. Concurrency Handling

**The invariant: `currentParticipants` can never exceed `maxParticipants`, and a user can never hold two active registrations.**

Convex mutations execute inside **serializable transactions with optimistic concurrency control (OCC)** — the direct analogue of the assignment's "MongoDB atomic conditional update / transaction" requirement:

- A registration transaction reads the competition document, verifies `currentParticipants < maxParticipants`, then writes the incremented value **and** inserts the registration. Both writes commit together or not at all.
- If two users register concurrently, both transactions read the same value but **one write conflicts on the competition document**; Convex automatically retries the loser against fresh state. On retry the re-check `currentParticipants >= maxParticipants` throws `COMPETITION_FULL` → surfaced as the assignment's 409-style structured error. No double-spend of spots is possible.
- **Rollback:** any failure after the increment throws before commit, so increment and registration vanish together — there are no orphan increments. (The explicit compensating patch in `registerUserAtomically` documents the same guarantee for engines without transactional rollback.)
- **Duplicate protection** is the `by_user_competition` compound index queried inside the same transaction — the equivalent of Mongo's unique `{userId, competitionId}` index. Two concurrent registrations by the same user conflict on that document, and the retry observes the committed registration and fails with `ALREADY_REGISTERED`.
- Cancellation decrements only when a spot was actually taken, inside the same transactional guarantee.

Why not read-then-save? Because two interleaved read→modify→write cycles would both pass the capacity check and both increment — the classic lost-update race. OCC closes exactly that window.

## 11. Payment Flow

`createOrder` records a **PENDING** order tied to the registration; nothing in the client can mark a payment successful. Confirmation is a **backend** mutation that transitions the order `PENDING → PAID|FAILED` and patches the registration's `paymentStatus` — exactly what a verified Razorpay webhook/verify endpoint would do.

- **Without `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`**: the provider resolves to `simulated` and the PaymentDialog offers "Pay" and "Simulate failure" — both exercise the real PENDING→PAID/FAILED paths and their UI states.
- **With credentials**: implement HMAC-SHA256 signature verification (`order_id|payment_id|signature`) in the marked extension point in `payments.ts`, add the webhook route as source of truth, and open Razorpay Checkout in the dialog. No other code changes needed — the order/registration state machine is already provider-agnostic.

## 12. Submission Flow

Real upload: the backend issues a short-lived upload URL → the client PUTs the raw video → `submissions.upsert` re-validates **server-side** (active registration, payment settled, window open on the server clock, video mime types only, ≤ `UPLOAD_MAX_SIZE`) before persisting. One submission per user+competition; editing replaces the file/fields without resetting review state, and submissions locked for review reject edits with `ALREADY_SUBMITTED`. Storage sits behind one mutation, so swapping Convex storage for S3/Cloudinary only changes the URL-issuing step.

## 13. Environment Variables

`.env.example` documents the full set. Backend-relevant vars (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `UPLOAD_MAX_SIZE`) are read in Convex functions via `process.env` and configured through the hosting platform's secret store — no secrets in code or git.

## 14–18. Installation, Running, MongoDB Setup, Seed

The platform manages the dev server and Convex deployment; the equivalent commands are:

```bash
bun install                # deps
bun convex dev --once      # push functions + regenerate types ("run backend")
bun convex run seed:seedAll  # seed ("npm run seed") — idempotent, upsert-by-slug
bun test src/lib/__tests__ # business-logic tests
bun tsc -b --noEmit        # typecheck
```

The seed creates/updates: demo admin + user roles, the **Feedants Classical Dance** competition (category Dance, Multi-Win, ₹1,500 pool, ₹99 fee, 20 capacity starting at 1 booked, judge Manju Dubey — Professional Kathak Dancer, 12+ years, the four reference dates in IST, 5 judging parameters, 4 rules, 3 eligibility items, six rewards 550/300/240/200/130/80, disclaimer, refund policy, four previous winners, referral reward ₹10, ENG+HINDI content). Re-running updates by slug instead of duplicating.

## 19. Demo Credentials

Email-OTP based: enter any address, receive the code, sign in. To reproduce the demo personas, sign in with the addresses above (seed assigns roles).

## 20. Testing

`bun test src/lib/__tests__` — 30 tests covering: status derivation for every lifecycle phase (including the reference data's **overlapping** registration/submission windows and full-capacity behavior), manual overrides, window helpers against the server clock, the 12 CTA states (logged-out, pay-and-register, free entry, payment pending, registered, upload, full, closed, results, cancelled, no conflicting states), countdown math (padding, rollover, expiry), and rewards-sum consistency with the prize pool.

Concurrency is enforced by the transaction engine (serializable OCC) rather than in-process test code — the guarantee is structural: conflicting writes are retried against fresh state, so an over-capacity commit cannot exist. The capacity re-check inside the transaction is covered by the "full competition" tests.

## 21. Important Assumptions

- The web "phone frame" is the deliverable UI; porting to true React Native is a view-layer swap (all state/data logic is platform-neutral).
- Entry fee payment is completed immediately after registration in the demo flow; a production app would add reminders/dunning for abandoned PENDING orders.
- `currentParticipants` is a denormalized counter on the competition document (fast reads); it is only ever mutated transactionally.
- Admin CRUD exists but no admin UI is exposed to normal users (per the assignment).
- Referral rewards are recorded at signup; payout settlement is out of scope.

## 22. Major Technical Decisions

- **Reactive queries instead of request/refetch caching.** Convex queries are live subscriptions, which satisfies React Query's invalidation role structurally: mutations write the same documents the UI subscribes to, so every client converges immediately. Polling `competitions.status` remains for countdown-expiry resilience.
- **One pure lifecycle module shared by client and server** — statuses/CTA can never disagree between surfaces, while the backend stays authoritative.
- **Status derived at read time** from dates (+ optional admin override) instead of a stored status that could drift; `DRAFT/CANCELLED/JUDGING/RESULTS_PUBLISHED` are overrides because they are administrative decisions, not clock states.
- **Envelope + typed error codes everywhere** so the UI can distinguish "full" vs "closed" vs "already registered" without string-matching.
- **Storage behind a single mutation** for a clean future S3/Cloudinary swap.

## 23. Trade-offs

- Denormalized participant counter: O(1) reads, but every registration touches the competition document (hot-document contention at extreme scale — see §24).
- Deriving status per read is trivially correct but recomputes per query; a cached column would trade correctness for speed.
- Email-OTP auth is simpler and secure but adds a code-copy step vs passwords; Convex Auth supports password/OTP/social providers interchangeably.
- The simulated gateway trades demo friction for realism of state handling (still a real PENDING→PAID/FAILED machine).

## 24. Scalability Considerations

- **Stateless functions**, indexed queries only (no table scans), `take(limit)` pagination on lists, one round trip for detail+userState (no N+1).
- The registration hot-document bottleneck can be lifted by sharding counters or moving to an atomic `findAndModify`-style conditional update (`currentParticipants < max` guard) on a dedicated counters collection — the OCC retry behavior stays identical.
- Uploads bypass function size limits via direct-to-storage PUT; a CDN in front of storage is the production step.
- Rate limiting at the edge/platform layer; typed error codes keep client retry logic cheap (`expected` vs `INTERNAL`).

## 25. Security Considerations

Server-side authorization on every function (`requireUser`/`requireAdmin`); payment success only ever originates from backend logic; submissions re-validated server-side (mime, size, window, registration, payment); schema-validated documents prevent injection-style payloads; user content rendered as text (no raw HTML); internal errors normalized so stack traces never reach clients; secrets only via platform env configuration, never committed.

## 26. Future Production Improvements

Razorpay checkout + verified webhooks (extension point already marked); S3/Cloudinary uploads with transcoding; payout settlement ledger for referrals/prizes; judge scoring workflow feeding `RESULTS_PUBLISHED`; push notifications for countdown/deadlines; per-IP rate limiting and WAF; E2E tests on device profiles; audit logging for admin mutations.
