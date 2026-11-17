# RepRise

RepRise is a Next.js workout tracker with Supabase authentication and cloud-synced workout completion. This update introduces the blue visual theme and the supplied 2026 five-day split.

## Run locally

1. Install Node.js (the project uses Next.js 16 and React 19).
2. Copy `.env.example` to `.env.local`.
3. Add your Supabase project URL and publishable key to `.env.local`.
4. Install dependencies with `npm install`.
5. Start the development server with `npm run dev`.
6. Open http://localhost:3000.

## Workout programme

- Monday: Push
- Tuesday: Pull + 20-minute low-intensity cardio
- Wednesday: Legs
- Thursday: Rest / recovery
- Friday: Upper + 20-minute low-intensity cardio
- Saturday: Lower
- Sunday: Rest / recovery

Existing workout reference images in `public/workout-references/` are reused. Where the new programme names an exercise without an exact existing image, the closest existing reference image is used as a visual guide.

## Supabase

The app continues to use the existing `workout_logs` table and stores completed exercise indices by date. No schema migration is required for this update. Existing records are retained.

## Security

Do not commit `.env.local` or publish Supabase secrets. `.env.local` is intentionally excluded from this handoff ZIP.
