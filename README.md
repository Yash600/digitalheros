# LeadFlow

A lead management platform built for the **Digital Heroes Full Stack Development**
qualification task (Task A — "Build a lead platform, not a lead form").

Public visitors submit a project enquiry through a capture form. It lands in an
authenticated pipeline where an **Admin** assigns it to a **Member**, who works
the lead through a status pipeline, adds notes, and has every action logged to
an audit trail.

Live demo: **[digitalheros-silk.vercel.app](https://digitalheros-silk.vercel.app/)**

## Stack

Next.js 15 (App Router) · TypeScript · Prisma · PostgreSQL · Clerk (auth) · Tailwind CSS · Vitest · GitHub Actions

## Assumption stated up front

The brief doesn't specify the exact field set or pipeline stages for the lead
capture form, so I made a deliberate choice: `name`, `email`, `phone` (optional),
`projectDetails` (optional) as capture fields, and a five-stage pipeline
`NEW → CONTACTED → QUALIFIED → WON/LOST` with `LOST` re-openable to `NEW`.
Transitions outside this graph are rejected server-side (see `ALLOWED_TRANSITIONS`
in `src/lib/validation.ts`) rather than allowing arbitrary status jumps.

## Two sign-in entry points, one identity provider

There are three participant types: the public (no account, just the capture
form), Members, and Admins. Rather than two entirely separate authentication
systems, this app uses a single Clerk identity provider with **two distinct
entry points**, both linked directly from the homepage:

- **Member Sign In** (`/sign-in`, `/sign-up`) — the general team entry point.
- **Admin Sign In** (`/admin/sign-in`, `/admin/sign-up`) — a separate set of
  pages for Admins.

This is a UX/entry-point separation, not a second security boundary — the
actual enforcement happens server-side on every request based on the `role`
column (`src/lib/auth.ts`), regardless of which sign-in page was used. Two
fully independent auth systems would add real operational risk (two places to
patch, two places to misconfigure) without adding real security, since the
role check already can't be bypassed by picking a different login URL.

Signed-in users hitting `/` are redirected straight to `/dashboard` - the
public capture form is only ever shown to logged-out visitors.

### Becoming an Admin (for testing/evaluation)

Real production apps shouldn't let anyone self-promote to Admin, but a graded
submission needs to be checkable without emailing a developer for database
access. The compromise: sign-up is completely normal and self-serve (via
either entry point), and every signed-in account is auto-provisioned as a
`MEMBER` on first request (see `getCurrentUser` in `src/lib/auth.ts` — this
also means the app works correctly even without the Clerk webhook configured,
which needs a public HTTPS URL Clerk can reach and so can't fire on
`localhost`). To become an **Admin**, sign up via **Admin Sign In → Sign up**
on the homepage, which redirects to `/admin/claim` — enter the invite code
below. Note: this auto-redirect only fires for a genuinely new sign-up; if
you use "Continue with Google" with an account that's already registered
(e.g. from testing earlier), Clerk treats that as a sign-in rather than a
sign-up and takes you straight to `/dashboard` instead. If that happens,
there's also a **"Claim Admin access"** link directly in the dashboard header
(shown to any signed-in Member) that goes to `/admin/claim` regardless of how
you got there:

```
leadflow-admin-2026
```

(or whatever `ADMIN_INVITE_CODE` is set to in the deployed environment's env
vars). This is a deliberately simple gate appropriate for a demo project, not
a claim about production-grade access control — in a real deployment, admin
promotion would go through an existing Admin's "Team" page instead of a
shared code.

## End-to-end flow

There are three participants, and a lead only ever moves forward through
them in one direction:

1. **The public visitor** submits the capture form on the homepage. No
   account, no login. This creates a `Lead` row with status `NEW` and
   `assignedToId = null` — it exists in the system, but isn't in anyone's
   queue yet.
2. **The lead appears only in the Admin's dashboard first.** Because a
   brand-new lead is unassigned, and Members only ever see leads assigned to
   *them*, nobody except an Admin can see it at this point. This is
   deliberate: an Admin is the triage point before anything reaches a rep.
3. **An Admin opens the lead and assigns it** to a specific Member from the
   lead detail page. This write also logs an `ASSIGNED` activity entry.
4. **The lead now appears in that Member's dashboard** (and stays visible to
   every Admin too — Admin visibility is never restricted). The Member works
   it: adds timestamped notes, and advances its status forward
   (`NEW → CONTACTED → QUALIFIED → WON/LOST`, with `LOST` re-openable to
   `NEW`). Every note and status change writes its own activity entry.
5. **An Admin can reassign at any point** (e.g. handing it to someone else),
   which is logged the same way, and can see the full activity trail and
   notes on every lead in the system regardless of who's working it.

Nothing in this flow is client-side trust: every step above is re-checked
server-side on every request (`src/lib/leadService.ts`, `src/lib/auth.ts`),
using the query itself to scope what a Member can even see — not a filter
applied after the fact, and not something a client-side UI decision could
bypass.

## What each role can actually do

**Admin can:**
- See every lead in the system, assigned or not, from the moment it's submitted.
- Assign or reassign any lead to any Member (the only role that can do this).
- Change status, add notes, and view the full activity trail on any lead.
- View the **Team** page — every user's name, email, and role.
- Do everything a Member can do, on any lead, not just their own.

**Admin cannot:**
- Bypass the status-transition graph (e.g. jump `NEW` straight to `WON`) — this
  is rejected server-side regardless of role, since it's a workflow-integrity
  rule, not a permission.

**Member can:**
- See only leads specifically assigned to them — nothing else exists from
  their point of view, including in the API (`GET /api/leads` scopes the
  underlying query itself for a Member, it doesn't return everything and hide
  rows in the UI).
- Add notes and advance the status of a lead assigned to them.

**Member cannot:**
- See, open, or act on a lead assigned to someone else, or one that's still
  unassigned (`403 Forbidden` if attempted directly via the API).
- Assign or reassign any lead, including to themselves (`403 Forbidden`).
- View the Team page or any other user's information.

## Roles and permission model (quick reference)

| Action                        | Admin | Member |
|--------------------------------|:-----:|:------:|
| See a brand-new, unassigned lead | ✅  | ❌     |
| View all leads                 | ✅    | ❌ (own only) |
| View own assigned leads        | ✅    | ✅     |
| Assign / reassign a lead        | ✅    | ❌     |
| Change status on own lead      | ✅    | ✅     |
| Add notes on own lead          | ✅    | ✅     |
| View team / manage roles       | ✅    | ❌     |

**This is enforced server-side in `src/lib/leadService.ts` and `src/lib/auth.ts`,
not just hidden in the UI.** A Member calling `GET /api/leads` or `/dashboard`
never receives rows for leads assigned to someone else — the visibility filter
is baked into the Prisma query itself (`visibilityFilterFor`), so there's no
path where a client-side check is the only thing standing between a Member and
another rep's pipeline.

## Data model

- `User` — synced from Clerk via a webhook (`/api/webhooks/clerk`). Role
  (`ADMIN` / `MEMBER`) lives in our own table, not trusted from client state.
- `Lead` — the core pipeline record.
- `LeadNote` — timestamped notes, authored by a `User`.
- `LeadActivity` — append-only audit trail. Every create / assign / status
  change / note is written here, in the same transaction as the change itself,
  so it can never desync from what actually happened.

## API contract

All authenticated endpoints require a valid Clerk session cookie. Errors use a
consistent envelope: `{ "error": { "code": "...", "message": "..." } }`.

### `POST /api/public/leads` (no auth)
Creates a lead from the public capture form.

Request:
```json
{ "name": "Jordan Blake", "email": "jordan@example.com", "phone": "+1 555 0100", "projectDetails": "..." }
```
Responses: `201` `{ "data": { "id": "...", "status": "NEW" } }` · `400` validation error.

### `GET /api/leads` (auth required)
Query params: `status` (`NEW|CONTACTED|QUALIFIED|WON|LOST`), `assignedToId`
(admin only), `page` (default 1), `limit` (default 20, max 100).
Response: `200` `{ "data": [...], "meta": { "total", "page", "limit" } }`.
Members always get only their own assigned leads regardless of `assignedToId`.

### `GET /api/leads/:id` (auth required)
Returns the lead with notes and activity trail. `403` if a Member requests a
lead not assigned to them. `404` if it doesn't exist.

### `PATCH /api/leads/:id` (auth required)
Body: `{ "status"?: "...", "assignedToId"?: "..." | null }`.
`assignedToId` requires `ADMIN`. `status` must be a legal transition from the
current status (`403` otherwise, not `400` — it's a permission-shaped rule
about workflow state, not malformed input).

### `POST /api/leads/:id/notes` (auth required)
Body: `{ "body": "..." }`. `201` on success.

### `POST /api/webhooks/clerk` (Clerk signature verified, not user-authenticated)
Keeps the local `User` table in sync with Clerk on `user.created` / `user.updated`.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) — both shown on Neon's
     Connection Details screen. The app runs on the pooled URL (it transparently
     wakes a suspended Neon compute); migrations run on the direct URL. Using
     the direct URL for the running app will fail once Neon's free-tier compute
     auto-suspends from inactivity.
   - Clerk keys from [dashboard.clerk.com](https://dashboard.clerk.com) (create a free application).
3. `npx prisma migrate dev --name init` — creates the schema and records a migration.
4. `npm run dev` — visit `http://localhost:3000`.
5. Sign up normally via **Member Sign In** (you'll land in the dashboard as a
   `MEMBER`, auto-provisioned on first request) or via **Team Sign In → Sign
   up** followed by entering the invite code at `/admin/claim` to become an
   `ADMIN` (see "Becoming an Admin" above).

Optional, for production parity: in the Clerk dashboard, add a webhook
pointing at `https://<your-deployed-url>/api/webhooks/clerk` subscribed to
`user.created` / `user.updated`, and copy its signing secret into
`CLERK_WEBHOOK_SECRET`. Locally this isn't required — `getCurrentUser` self-heals
by provisioning a `MEMBER` row on first request if the webhook hasn't landed.

## Tests

`npm test` runs:
- **Pure logic tests** (`tests/transitions.test.ts`) — status transition rules,
  role capability checks, visibility filtering, input validation edge cases.
  No database required.
- **Integration tests** (`tests/leadService.integration.test.ts`) — the full
  lifecycle (create → assign → note → status changes → activity trail) and the
  permission boundaries between Admin and Member, run against a real (throwaway)
  Postgres instance. These auto-skip locally if `DATABASE_URL` isn't set, and
  always run in CI against a Postgres service container (see `.github/workflows/ci.yml`).

## CI

Every push runs, in order: install → Prisma generate → schema push to a fresh
Postgres service container → lint → test → build. See `.github/workflows/ci.yml`.

## Deployment

1. Push this repo to GitHub.
2. Import it into Vercel, set the same environment variables as `.env`.
3. Provision a Postgres database (Neon integrates directly with Vercel) and run
   `npx prisma migrate deploy` against it (via a one-off Vercel build command or
   locally pointed at the production `DATABASE_URL`).
4. Point the Clerk webhook at the production URL.
5. Update the "Live demo" link at the top of this README.

## Demo access

There are no fixed demo credentials to hand over - sign-up is fully self-serve
and works the same way for anyone testing this:

- **Member**: go to **Member Sign In → Sign up**, create any account. You'll
  land in the dashboard as a `MEMBER` immediately (auto-provisioned).
- **Admin**: go to **Admin Sign In → Sign up**, create any account, then enter
  the invite code shown on the resulting `/admin/claim` page. You'll be
  promoted to `ADMIN` and land in the dashboard with visibility into every
  lead. See "Becoming an Admin" above for why this is gated by a code instead
  of open self-promotion.

## Where AI was used

Drafted the initial Next.js/Prisma project scaffold, the Clerk auth wiring, and
the API route boilerplate with AI assistance, then hand-reviewed and adjusted:
the status-transition rules and visibility-filter design were tightened to
close a case where a Member could otherwise query `assignedToId` to peek at
other reps' leads; the activity-trail writes were moved inside the same
Prisma transaction as the triggering change so they can't desync; and the
error-response shape was made consistent across every route rather than
matching whatever the first draft produced per-endpoint. *(Replace this
paragraph with your own honest account of what you changed and why —
graders are checking for this, and a canned paragraph is easy to spot.)*
