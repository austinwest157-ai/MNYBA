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
- **Single-user passcode login**: no accounts to manage — just a shared
  passcode, since this is meant for one person (or a small team sharing one
  passcode) to run the pipeline.

## Tech stack

Next.js (App Router) + TypeScript + Tailwind CSS, Prisma ORM with SQLite for
local development, and the Web Push API (`web-push` + VAPID) for
notifications.

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and fill it in:

   ```bash
   cp .env.example .env
   ```

   - `APP_PASSCODE` — the passcode you'll type in to log in.
   - `SESSION_SECRET` — random string, e.g. `openssl rand -hex 32`.
   - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — generate with
     `npx web-push generate-vapid-keys`. Also copy the public key into
     `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same value, just exposed to the browser).
   - `VAPID_SUBJECT` — a `mailto:` address, required by the Web Push spec.
   - `CRON_SECRET` — random string that protects the follow-up-check endpoint.

3. Create the local SQLite database:

   ```bash
   npx prisma migrate dev
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000, log in with your `APP_PASSCODE`, and start
   adding prospects.

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

## Deploying

### Recommended: Vercel + a hosted Postgres database

SQLite is great for local dev, but Vercel's filesystem is read-only/ephemeral
in production, so the database needs to live somewhere else. The Vercel +
Postgres combo also gets you Vercel Cron for free, which is what triggers the
follow-up push notifications.

1. **Switch the database provider.** In `prisma/schema.prisma`, change:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

   Then delete `prisma/migrations` and run `npx prisma migrate dev --name init`
   again locally against a Postgres URL (e.g. from
   [Neon](https://neon.tech), [Supabase](https://supabase.com), or Vercel's
   own Postgres add-on — all have free tiers) to regenerate the migration
   for Postgres.

2. **Push this repo to GitHub** and import it into Vercel.

3. **Set environment variables** in the Vercel project settings: `DATABASE_URL`
   (your Postgres connection string), `APP_PASSCODE`, `SESSION_SECRET`,
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
   `VAPID_SUBJECT`, and `CRON_SECRET`. Generate fresh values for the secrets
   rather than reusing the local dev ones in `.env.example`.

4. **Vercel Cron is already configured** in `vercel.json` to hit
   `/api/cron/check-followups` daily at 13:00 UTC (~9am Eastern). Vercel
   automatically sends `Authorization: Bearer $CRON_SECRET` on cron requests
   when a `CRON_SECRET` env var is set, so no extra wiring is needed. Adjust
   the schedule or add more times in `vercel.json` if you want more frequent
   checks.

5. Deploy. Vercel runs `prisma generate` automatically via the `postinstall`
   script, and applies migrations if you add
   `npx prisma migrate deploy && next build` as the build command (or run
   `npm run db:migrate:deploy` manually against the production `DATABASE_URL`
   after your first deploy).

### Alternative: self-host with SQLite

If you'd rather run this on a small always-on server or VM (so you don't have
to switch off SQLite), you can skip the Postgres migration above. You'll need:

- A process manager (`pm2`, `systemd`, Docker, etc.) running `npm run build`
  then `npm start`, with a persistent volume for `prisma/dev.db`.
- Your own cron (a `cron` entry, or a tool like `cron-job.org` if the server
  is reachable over the internet) hitting
  `https://your-domain/api/cron/check-followups?secret=<CRON_SECRET>` daily.

## Enabling push notifications (after deploying)

1. Log in on the device/browser you want reminders on.
2. Go to **Settings** and click **Enable follow-up reminders**.
3. Approve the browser's notification permission prompt.

Notifications only work over HTTPS (or `localhost`), so this step won't work
until the app is deployed with a real domain (or tested locally).

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
