# MNYBA Fundraising Prospect Tracker

A lightweight CRM for the Metropolitan New York Baptist Association to track
fundraising prospects **before** they start giving — from the first
conversation through commitment. Once someone is actively giving, they graduate
to the org's regular giving/finance system; this app is for everything before
that.

## Features

- **Quick-add form**: name, organization, phone, email, stage, estimated gift,
  and notes.
- **Pipeline dashboard**: a board of every active prospect grouped by stage
  (New Lead → First Conversation → Following Up → Meeting Scheduled →
  Proposal Sent → Verbal Commitment → Committed → Actively Giving, plus a
  separate Not Interested bucket), with summary stats at the top.
- **Conversation log**: log each contact on a prospect's detail page; this
  automatically updates their "last contacted" date.
- **Automatic follow-up reminders**: any active prospect who hasn't been
  logged as contacted in 14 days is flagged "Needs follow-up" on the
  dashboard. You can also set a custom next-follow-up date per prospect.
- **Push notifications**: opt in from Settings and a scheduled job will send
  a browser push notification listing anyone overdue for a follow-up.
- **Optional passcode login**: the app has no login at all out of the box —
  anyone with the link can use it. If you want to require a passcode, turn
  it on from **Settings**; it's stored (hashed) in the database, so there's
  no environment variable to configure or redeploy.

## Tech stack

Next.js (App Router) + TypeScript + Tailwind CSS, Prisma ORM with Postgres,
and the Web Push API (`web-push` + VAPID) for notifications.

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Have a Postgres database available (a local install, or a free hosted one
   from [Neon](https://neon.tech) or [Supabase](https://supabase.com) works
   fine for local dev too).

3. Copy the example environment file and fill it in:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — your Postgres connection string.
   - `SESSION_SECRET` — random string, e.g. `openssl rand -hex 32` (used to
     sign the login session cookie, only relevant once you enable a passcode).
   - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — generate with
     `npx web-push generate-vapid-keys`. Also copy the public key into
     `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same value, just exposed to the browser).
   - `VAPID_SUBJECT` — a `mailto:` address, required by the Web Push spec.
   - `CRON_SECRET` — random string that protects the follow-up-check endpoint.

4. Apply the database schema:

   ```bash
   npx prisma migrate dev
   ```

5. Run the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and start adding prospects — no login is
   required until you turn one on from Settings.

## How follow-up reminders work

Every prospect (except those marked **Actively Giving** or **Not Interested**)
has an implicit "due" date:

- If you set a custom **next follow-up date** on their detail page, that's
  used.
- Otherwise, it defaults to **14 days after their last logged contact** (or
  14 days after they were created, if never contacted).

The dashboard shows anyone past that date under "Needs follow-up." Logging a
new conversation resets the clock.

To get an actual push notification (not just the dashboard banner), a
scheduled job has to periodically call `GET /api/cron/check-followups`. That
route requires either:

- an `Authorization: Bearer <CRON_SECRET>` header, or
- a `?secret=<CRON_SECRET>` query parameter,

and it sends one push notification per subscribed browser listing everyone
currently overdue.

## Deploying to Vercel

1. **Push this repo to GitHub** (already done if you're reading this from the
   repo). Note which branch you want deployed.

2. **Go to [vercel.com/new](https://vercel.com/new)**, sign in (GitHub login
   is easiest), and import this repository. If it asks which branch to use
   as production, pick the branch with this app on it.

3. **Add a Postgres database.** In the same import flow (or afterwards, from
   the project's **Storage** tab), add a Postgres database — Vercel offers
   one built in (Neon-backed), or you can paste in a connection string from
   [Neon](https://neon.tech) or [Supabase](https://supabase.com) instead.
   Either way, this sets the `DATABASE_URL` environment variable for you (or
   you set it yourself if using an external provider).

4. **Set the remaining environment variables** in the project's
   **Settings → Environment Variables**: `SESSION_SECRET`,
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
   `VAPID_SUBJECT`, and `CRON_SECRET`. Generate fresh values — don't reuse the
   placeholder ones from `.env.example`. (`npx web-push generate-vapid-keys`
   locally gives you the VAPID pair; `openssl rand -hex 32` works for the
   secrets.)

5. **Deploy.** Vercel runs `npm install` (which runs `prisma generate` via
   the `postinstall` script) and then `npm run build`. After the first
   deploy succeeds, run the migration against the production database once:

   ```bash
   DATABASE_URL="<your production connection string>" npx prisma migrate deploy
   ```

   (Run this from your own machine, with the production `DATABASE_URL` from
   the Vercel dashboard — it only needs to be run once, and again after any
   future schema change.)

6. **Vercel Cron is already configured** in `vercel.json` to hit
   `/api/cron/check-followups` daily at 13:00 UTC (~9am Eastern). Vercel
   automatically sends `Authorization: Bearer $CRON_SECRET` on cron requests
   when a `CRON_SECRET` env var is set, so no extra wiring is needed. Adjust
   the schedule in `vercel.json` if you want a different time or frequency.

Once deployed, Vercel gives you a URL like `your-project.vercel.app`. Anyone
with that link can open the app right away — set a passcode from Settings
once you're ready to lock it down (see below).

### Alternative: self-host on your own server

If you'd rather not use Vercel, any Node host works: run `npm run build` then
`npm start` behind a process manager (`pm2`, `systemd`, Docker), point
`DATABASE_URL` at any reachable Postgres instance, and set up your own cron
(a `cron` entry, or `cron-job.org` if the server is internet-reachable)
hitting `https://your-domain/api/cron/check-followups?secret=<CRON_SECRET>`
daily.

## Enabling push notifications (after deploying)

1. Log in on the device/browser you want reminders on.
2. Go to **Settings** and click **Enable follow-up reminders**.
3. Approve the browser's notification permission prompt.

Notifications only work over HTTPS (or `localhost`), so this step won't work
until the app is deployed with a real domain (or tested locally).

## Login (off by default)

There is no environment variable for the passcode — the app simply has no
login until you turn one on, entirely from the running app itself:

- **Turn on login**: go to **Settings**, enter a new passcode (twice, to
  confirm), and save. From that point on, opening the app requires it.
- **Change the passcode**: same place — enter the current passcode and a new
  one.
- **Turn login off again**: enter the current passcode and click "Turn off
  login." The app goes back to being open to anyone with the link.

All of this is stored (hashed) in the database and takes effect immediately
— no environment variables, no redeploying, nothing to get out of sync with
a hosting dashboard.

Existing logged-in sessions on other devices/browsers aren't forced out when
you change the passcode — they stay valid until they naturally expire (30
days) or you clear cookies. Turning login off makes that moot, since nothing
is checked at all while it's off.

## Known limitations / things to revisit

- `npm audit` flags a couple of high-severity advisories in Prisma's CLI
  dependency tree (`deepmerge-ts`, pulled in via `@prisma/config`). These are
  build-time-only dependencies of the `prisma` CLI, not runtime code shipped
  in the deployed app, and not something this app's own config triggers —
  low priority for a single-user internal tool, but worth re-checking next
  time you bump the `prisma` package.
- Deleting a prospect from the UI archives it (soft delete) rather than
  removing it permanently, so historical data isn't lost by accident.
- The passcode is shared/single-user by design. If multiple staff need
  distinct logins and permissions later, that's a bigger change (real
  accounts, roles) worth planning separately.
