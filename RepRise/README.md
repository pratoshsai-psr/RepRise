# My Workout Tracker — online version

A mobile/tablet/desktop workout tracker based on the supplied 7-day gym plan. It uses Next.js + Supabase and is designed for Vercel deployment.

## Features

- Auckland/New Zealand date handling.
- Monday–Sunday workout schedule from the supplied plan.
- Check off individual exercises.
- Automatic day completion when every item is checked.
- Past and future date navigation.
- Weekly overview.
- Current streak and best streak.
- Cloud-saved history, so the same account works across phone, tablet and computer.
- Installable as a PWA from a supported mobile browser.

## 1. Create/configure Supabase

Create/open a Supabase project.

In **SQL Editor**, run `supabase.sql`.

From Supabase project settings, copy:
- Project URL
- Publishable key (or anon key if your project labels it that way)

Put them in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_KEY
```

For a quick local test, you can disable email confirmation in Supabase Auth settings. For production, keeping email confirmation enabled is recommended.

## 2. Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 3. Deploy to Vercel

Push this folder to a GitHub repository, then import the repository into Vercel.

Add these Vercel environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Deploy.

## 4. Use on phone/tablet

Open the deployed URL on your phone or tablet and sign in with the same account. Your completed workouts are stored in Supabase, not just in the browser. On supported browsers, use **Add to Home Screen** to install it like an app.
