'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type Exercise = {
  name: string;
  target: string;
  intensity: string;
  cue: string;
  image: string;
};

type Plan = {
  focus: string;
  items: Exercise[];
  recovery?: boolean;
  cardio?: string;
  guidance: string;
};

type LogMap = Record<string, number[]>;

/* =========================================================
   REP RISE — 2026 FIVE-DAY SPLIT
   Exercise references reuse the images already in /public.
   ========================================================= */

const PLAN: Record<string, Plan> = {
  Monday: {
    focus: 'Push',
    guidance: 'Warm up first. Use a controlled 3-second lowering phase. Keep your shoulder blades stable on presses and stop if form breaks down.',
    items: [
      { name: 'Chest Press', target: '3 × 4–6', intensity: 'RPE 9–10', cue: '3 sec down, pause briefly, then press with control. Keep shoulder blades set.', image: '/workout-references/monday/machine-chest-press.png' },
      { name: 'Incline Press', target: '3 × 5–8', intensity: 'RPE 9–10', cue: 'Use a modest incline and keep ribs down. Control the stretch at the bottom.', image: '/workout-references/monday/incline-machine-chest-press.png' },
      { name: 'Shoulder Press', target: '3 × 6–8', intensity: 'RPE 9–10', cue: 'Brace your core and avoid arching your lower back as you press.', image: '/workout-references/thursday/seated-dumbbell-shoulder-press.png' },
      { name: 'Triceps Extension', target: '3 × 8–12', intensity: 'To failure*', cue: 'Keep elbows steady and lower the weight slowly. Choose a comfortable overhead or cable variation.', image: '/workout-references/monday/dumbbell-overhead-triceps-extension.png' },
    ],
  },
  Tuesday: {
    focus: 'Pull + Cardio',
    cardio: '20 minutes low-intensity cardio — treadmill incline walk, elliptical or Stairmaster at a conversational pace.',
    guidance: 'Focus on moving through a comfortable range and feeling the back muscles work. Avoid swinging or using momentum on curls.',
    items: [
      { name: 'Lat Pulldown', target: '3 × 6–8', intensity: 'RPE 8–9', cue: 'Allow a full stretch at the top, then pull elbows down towards your hips.', image: '/workout-references/tuesday/lat-pulldown.png' },
      { name: 'Upper-Back Focused Row', target: '3 × 8–10', intensity: 'RPE 8–9', cue: 'Let elbows travel out slightly. Pause briefly when shoulder blades come together.', image: '/workout-references/thursday/dumbbell-rear-delt-fly.png' },
      { name: 'Bicep Curl', target: '3 × 8–10', intensity: 'To failure*', cue: 'Keep elbows by your sides. Lower for 3 seconds without swinging.', image: '/workout-references/tuesday/dumbbell-biceps-curl.png' },
      { name: 'Hammer Curl', target: '3 × 8–10', intensity: 'To failure*', cue: 'Keep a neutral grip and control the full lowering phase.', image: '/workout-references/tuesday/dumbbell-hammer-curl.png' },
    ],
  },
  Wednesday: {
    focus: 'Legs',
    guidance: 'Prioritise comfortable depth and controlled technique. For heavy lower-body movements, finish the set if form starts to deteriorate.',
    items: [
      { name: 'Squat', target: '3 × 4–6', intensity: 'RPE 9–10', cue: 'Brace your trunk and use a pain-free depth. A leg press or goblet squat is a gym alternative.', image: '/workout-references/wednesday/goblet-squat.png' },
      { name: 'Hip Hinge / Romanian Deadlift', target: '3 × 5–8', intensity: 'RPE 9–10', cue: 'Push hips back, keep the weight close to your legs and feel the hamstring stretch.', image: '/workout-references/wednesday/seated-leg-press.png' },
      { name: 'Leg Extension', target: '3 × 10–12', intensity: 'To failure*', cue: 'Pause and squeeze at the top, then lower the weight for 3 seconds.', image: '/workout-references/wednesday/leg-extension.png' },
      { name: 'Hamstring Curl', target: '3 × 10–12', intensity: 'To failure*', cue: 'Use the full comfortable range and avoid letting the weight drop.', image: '/workout-references/wednesday/leg-curl.png' },
      { name: 'Calf Raise', target: '4 × 12–15', intensity: 'To failure*', cue: 'Use a full stretch at the bottom and avoid bouncing.', image: '/workout-references/wednesday/standing-calf-raise.png' },
    ],
  },
  Thursday: {
    focus: 'Rest & Recovery',
    recovery: true,
    guidance: 'Protect your recovery day. Keep activity light and comfortable; no hard training is scheduled.',
    items: [
      { name: 'Easy Walk (optional)', target: '20–30 min', intensity: 'Easy pace', cue: 'A relaxed walk is optional. Keep it easy enough to hold a conversation.', image: '/workout-references/saturday/treadmill-walking.png' },
      { name: 'Gentle Mobility (optional)', target: '5–10 min', intensity: 'Gentle', cue: 'Move comfortably through hips, shoulders and ankles. Do not force stretches.', image: '/workout-references/thursday/day-reference.png' },
    ],
  },
  Friday: {
    focus: 'Upper + Cardio',
    cardio: '20 minutes low-intensity cardio — treadmill incline walk, elliptical or Stairmaster at a conversational pace.',
    guidance: 'Use controlled reps and a comfortable range. Choose a dip alternative such as a machine chest press if dips bother your shoulders.',
    items: [
      { name: 'Chest Fly', target: '3 × 10–12', intensity: 'To failure*', cue: 'Keep a soft bend in the elbows and control the stretch. Do not force the bottom position.', image: '/workout-references/monday/machine-fly-pec-deck.png' },
      { name: 'Lat-Focused Row', target: '3 × 8–10', intensity: 'RPE 8–9', cue: 'Drive elbows back with control and pause briefly at the top.', image: '/workout-references/friday/chest-supported-dumbbell-row.png' },
      { name: 'Lateral Raise', target: '3 × 12–15', intensity: 'To failure*', cue: 'Lead with elbows and stop around shoulder height. Avoid momentum.', image: '/workout-references/thursday/dumbbell-lateral-raise.png' },
      { name: 'Dips', target: '3 × 6–8', intensity: 'RPE 9–10', cue: 'Use a controlled range. Substitute a chest press if dips are uncomfortable or not yet suitable.', image: '/workout-references/monday/cable-triceps-pushdown.png' },
      { name: 'Bicep Curl', target: '3 × 8–10', intensity: 'To failure*', cue: 'Keep elbows close to your sides and lower slowly.', image: '/workout-references/friday/dumbbell-biceps-curl.png' },
      { name: 'Crunch', target: '2 × 15–20', intensity: 'To failure*', cue: 'Curl ribs towards pelvis with a small controlled movement; avoid turning it into a sit-up.', image: '/workout-references/saturday/machine-abdominal-crunch.png' },
    ],
  },
  Saturday: {
    focus: 'Lower',
    guidance: 'Prioritise stable positions and controlled repetitions. Use support for split squats if balance is a challenge.',
    items: [
      { name: 'Hip Thrust', target: '3 × 8–10', intensity: 'RPE 9–10', cue: 'Drive through glutes, pause at the top and avoid overextending your lower back.', image: '/workout-references/saturday/seated-leg-press.png' },
      { name: 'Bulgarian Split Squat', target: '3 × 8–10', intensity: 'RPE 9–10', cue: 'Use a stable support if needed. Keep your front foot planted and torso controlled.', image: '/workout-references/wednesday/goblet-squat.png' },
      { name: 'Hip Abductor', target: '3 × 12–15', intensity: 'To failure*', cue: 'Control the return and pause briefly when moving knees outward.', image: '/workout-references/saturday/leg-extension.png' },
      { name: 'Calf Raise', target: '4 × 12–15', intensity: 'To failure*', cue: 'Use a full comfortable range and avoid bouncing.', image: '/workout-references/saturday/standing-calf-raise.png' },
      { name: 'Leg Raise', target: '2 × 12–15', intensity: 'To failure*', cue: 'Lower legs slowly. Bend knees as needed to keep your lower back comfortable.', image: '/workout-references/saturday/machine-abdominal-crunch.png' },
    ],
  },
  Sunday: {
    focus: 'Rest & Recovery',
    recovery: true,
    guidance: 'A second recovery day is built into the programme. Sleep, eat consistently, hydrate and let your body recover.',
    items: [
      { name: 'Easy Walk (optional)', target: '20–30 min', intensity: 'Easy pace', cue: 'Optional relaxed movement only. Keep it comfortable.', image: '/workout-references/saturday/treadmill-walking.png' },
      { name: 'Gentle Mobility (optional)', target: '5–10 min', intensity: 'Gentle', cue: 'Light mobility if it feels good. Rest fully if you need it.', image: '/workout-references/thursday/day-reference.png' },
    ],
  },
};

/* =========================================================
   DATE HELPERS
   ========================================================= */

const NZ_TZ = 'Pacific/Auckland';

function nzToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: NZ_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function dateObj(date: string) {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(
    Date.UTC(year, month - 1, day)
  );
}

function dateStr(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shift(date: string, amount: number) {
  const d = dateObj(date);

  d.setUTCDate(
    d.getUTCDate() + amount
  );

  return dateStr(d);
}

function dayName(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(dateObj(date));
}

function pretty(date: string) {
  return new Intl.DateTimeFormat('en-NZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateObj(date));
}

function weekStart(date: string) {
  const d = dateObj(date);

  const mondayIndex =
    (d.getUTCDay() + 6) % 7;

  return shift(
    date,
    -mondayIndex
  );
}

function sameOrBefore(
  a: string,
  b: string
) {
  return a <= b;
}

/* =========================================================
   AUTH PANEL
   ========================================================= */

function AuthPanel({
  email,
  setEmail,
  password,
  setPassword,
  mode,
  setMode,
  busy,
  error,
  onSubmit,
  onSignOut,
  userEmail,
}: {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  mode: 'signin' | 'signup';
  setMode: (
    value: 'signin' | 'signup'
  ) => void;
  busy: boolean;
  error: string;
  onSubmit: () => void;
  onSignOut: () => void;
  userEmail: string | null;
}) {
  if (userEmail) {
    return (
      <div className="account">
        <span>
          Signed in as{' '}
          <b>{userEmail}</b>
        </span>

        <button
          className="ghost"
          onClick={onSignOut}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div>
        <div className="eyebrow">
          Cloud sync
        </div>

        <h2>
          {mode === 'signin'
            ? 'Welcome back'
            : 'Create your account'}
        </h2>

        <p>
          Your workout history will
          follow you on phone, tablet
          and computer.
        </p>
      </div>

      <div className="auth-fields">

        <input
          aria-label="Email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          aria-label="Password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          className="primary"
          onClick={onSubmit}
          disabled={busy}
        >
          {busy
            ? 'Working…'
            : mode === 'signin'
              ? 'Sign in'
              : 'Create account'}
        </button>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <button
          className="link-button"
          onClick={() =>
            setMode(
              mode === 'signin'
                ? 'signup'
                : 'signin'
            )
          }
        >
          {mode === 'signin'
            ? 'New here? Create an account'
            : 'Already have an account? Sign in'}
        </button>

      </div>
    </div>
  );
}

/* =========================================================
   MAIN APP
   ========================================================= */

export default function Home() {

  const [
    userEmail,
    setUserEmail,
  ] = useState<string | null>(null);

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(nzToday());

  const [
    logs,
    setLogs,
  ] = useState<LogMap>({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    authBusy,
    setAuthBusy,
  ] = useState(false);

  const [
    authError,
    setAuthError,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    authMode,
    setAuthMode,
  ] = useState<
    'signin' | 'signup'
  >('signin');

  const today = nzToday();

  const selectedName =
    dayName(selectedDate);

  const plan =
    PLAN[selectedName];

  // Recovery days use one explicit completion flag (index 0). Older recovery
  // records with optional-task indices [0, 1] remain recognised as complete.
  const checked = plan.recovery
    ? ((logs[selectedDate] ?? []).length > 0 ? [0] : [])
    : (logs[selectedDate] ?? []).filter((index) => index >= 0 && index < plan.items.length);

  // Rest days have a single manual completion flag, even though their
  // optional recovery suggestions are not trackable exercises.
  const selectedComplete = plan.recovery
    ? checked.length > 0
    : checked.length === plan.items.length;

  const progress = plan.recovery
    ? (selectedComplete ? 100 : 0)
    : Math.round(
        (checked.length /
          plan.items.length) *
          100
      );

  /* =====================================================
     COMPLETED DAYS
     ===================================================== */

  const allCompletedDates =
    useMemo(() => {

      return new Set(
        Object.entries(logs)
          .filter(
            ([date, indices]) =>
              sameOrBefore(
                date,
                today
              ) &&
              (PLAN[dayName(date)].recovery
                ? indices.length > 0
                : indices.filter((index) => index >= 0 && index < PLAN[dayName(date)].items.length).length === PLAN[dayName(date)].items.length)
          )
          .map(([date]) => date)
      );

    }, [logs, today]);

  /* =====================================================
     CURRENT STREAK
     ===================================================== */

  const streak = useMemo(() => {

    let date = today;
    let current = 0;

    if (
      !allCompletedDates.has(
        date
      )
    ) {
      date = shift(
        date,
        -1
      );
    }

    while (
      allCompletedDates.has(
        date
      )
    ) {
      current++;

      date = shift(
        date,
        -1
      );
    }

    return current;

  }, [
    allCompletedDates,
    today,
  ]);

  /* =====================================================
     BEST STREAK
     ===================================================== */

  const bestStreak =
    useMemo(() => {

      const dates =
        [...allCompletedDates]
          .sort();

      let best = 0;
      let run = 0;
      let previous = '';

      for (
        const date of dates
      ) {

        if (
          previous &&
          shift(
            previous,
            1
          ) === date
        ) {
          run++;
        } else {
          run = 1;
        }

        best =
          Math.max(
            best,
            run
          );

        previous = date;
      }

      return best;

    }, [
      allCompletedDates,
    ]);

  /* =====================================================
     WEEK
     ===================================================== */

  const weekDates =
    useMemo(() => {

      return Array.from(
        { length: 7 },
        (_, index) =>
          shift(
            weekStart(
              selectedDate
            ),
            index
          )
      );

    }, [
      selectedDate,
    ]);

  const weekDone =
    weekDates.filter(
      (date) =>
        allCompletedDates.has(
          date
        )
    ).length;

  /* =====================================================
     LOAD SUPABASE LOGS
     ===================================================== */

  async function loadLogs(
    userId: string
  ) {

    setLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from('workout_logs')
      .select(
        'workout_date, completed_exercises'
      )
      .eq(
        'user_id',
        userId
      )
      .order(
        'workout_date',
        {
          ascending: true,
        }
      );

    if (error) {

      setAuthError(
        error.message
      );

      setLoading(false);

      return;
    }

    const next: LogMap = {};

    for (
      const row of data ?? []
    ) {

      next[
        row.workout_date
      ] =
        Array.isArray(
          row.completed_exercises
        )
          ? row.completed_exercises.map(
              Number
            )
          : [];
    }

    setLogs(next);

    setLoading(false);
  }

  /* =====================================================
     AUTH LISTENER
     ===================================================== */

  useEffect(() => {

    let mounted = true;

    supabase.auth
      .getSession()
      .then(
        async ({
          data,
        }) => {

          if (!mounted)
            return;

          const user =
            data.session?.user;

          setUserEmail(
            user?.email ??
              null
          );

          if (user) {

            await loadLogs(
              user.id
            );

          } else {

            setLoading(
              false
            );
          }
        }
      );

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          session
        ) => {

          const user =
            session?.user;

          setUserEmail(
            user?.email ??
              null
          );

          if (user) {

            await loadLogs(
              user.id
            );

          } else {

            setLogs({});

            setLoading(
              false
            );
          }
        }
      );

    return () => {

      mounted = false;

      listener.subscription.unsubscribe();
    };

  }, []);

  /* =====================================================
     SIGN IN / SIGN UP
     ===================================================== */

  async function authSubmit() {

    if (
      !email ||
      !password
    ) {

      setAuthError(
        'Please enter your email and password.'
      );

      return;
    }

    setAuthBusy(true);
    setAuthError('');

    const result =
      authMode === 'signin'
        ? await supabase.auth
            .signInWithPassword({
              email,
              password,
            })
        : await supabase.auth
            .signUp({
              email,
              password,
            });

    setAuthBusy(false);

    if (result.error) {

      setAuthError(
        result.error.message
      );

      return;
    }

    if (
      authMode === 'signup' &&
      !result.data.session
    ) {

      setAuthError(
        'Account created. Check your email to confirm it, then sign in.'
      );
    }
  }

  /* =====================================================
     SIGN OUT
     ===================================================== */

  async function signOut() {

    await supabase.auth.signOut();
  }

  /* =====================================================
     CHECK / UNCHECK EXERCISE
     ===================================================== */

  async function setExercise(
    index: number,
    value: boolean
  ) {

    if (!userEmail)
      return;

    const current = plan.recovery
      ? ((logs[selectedDate] ?? []).length > 0 ? [0] : [])
      : [...(logs[selectedDate] ?? []).filter((i) => i >= 0 && i < plan.items.length)];

    const next = plan.recovery
      ? (value ? [0] : [])
      : value
        ? [
            ...new Set([
              ...current,
              index,
            ]),
          ]
        : current.filter(
            (i) =>
              i !== index
          );

    setLogs(
      (previous) => ({
        ...previous,

        [selectedDate]:
          next,
      })
    );

    const {
      data: session,
    } =
      await supabase.auth.getSession();

    const user =
      session.session?.user;

    if (!user)
      return;

    const {
      error,
    } = await supabase
      .from('workout_logs')
      .upsert(
        {
          user_id:
            user.id,

          workout_date:
            selectedDate,

          completed_exercises:
            next,
        },
        {
          onConflict:
            'user_id,workout_date',
        }
      );

    if (error) {

      setAuthError(
        error.message
      );
    }
  }

  /* =====================================================
     COMPLETE ALL
     ===================================================== */

  async function completeAll() {

    if (!userEmail)
      return;

    const allIndices = plan.recovery
      ? [0]
      : plan.items.map((_, index) => index);

    setLogs(
      (previous) => ({
        ...previous,

        [selectedDate]:
          allIndices,
      })
    );

    const {
      data: session,
    } =
      await supabase.auth.getSession();

    const user =
      session.session?.user;

    if (!user)
      return;

    const {
      error,
    } = await supabase
      .from('workout_logs')
      .upsert(
        {
          user_id:
            user.id,

          workout_date:
            selectedDate,

          completed_exercises:
            allIndices,
        },
        {
          onConflict:
            'user_id,workout_date',
        }
      );

    if (error) {

      setAuthError(
        error.message
      );
    }
  }

  /* =====================================================
     RESET EVERYTHING
     ===================================================== */

  async function resetAll() {

    if (
      !userEmail ||
      !confirm(
        'Reset all saved workout progress from your account?'
      )
    ) {
      return;
    }

    const {
      data: session,
    } =
      await supabase.auth.getSession();

    const user =
      session.session?.user;

    if (!user)
      return;

    const {
      error,
    } = await supabase
      .from('workout_logs')
      .delete()
      .eq(
        'user_id',
        user.id
      );

    if (error) {

      setAuthError(
        error.message
      );

    } else {

      setLogs({});
    }
  }

  /* =====================================================
     SERVICE WORKER
     ===================================================== */

  useEffect(() => {

    if (
      'serviceWorker' in
      navigator
    ) {

      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {});
    }

  }, []);

  /* =====================================================
     PAGE
     ===================================================== */

  return (

    <main className="page">



      <div className="wrap">

        {/* =================================================
           HEADER
           ================================================= */}

        <header className="hero">

          <div>

            <div className="eyebrow">
              TRAIN WITH INTENTION
            </div>

            <h1>
              RepRise
            </h1>

            <p>
              A smarter view of your training, recovery and progress.
            </p>

          </div>

          <div className="nz-badge">
            🇳🇿 Auckland time
          </div>

        </header>

        {/* =================================================
           AUTH
           ================================================= */}

        <AuthPanel
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          mode={authMode}
          setMode={setAuthMode}
          busy={authBusy}
          error={authError}
          onSubmit={authSubmit}
          onSignOut={signOut}
          userEmail={userEmail}
        />

        {userEmail && (

          <>

            {/* =============================================
               STATS
               ============================================= */}

            <section className="stats">

              <div className="stat">

                <b>
                  🔥 {streak}
                </b>

                <span>
                  Current streak
                </span>

              </div>

              <div className="stat">

                <b>
                  🏆 {bestStreak}
                </b>

                <span>
                  Best streak
                </span>

              </div>

              <div className="stat">

                <b>
                  ✅ {allCompletedDates.size}
                </b>

                <span>
                  Completed days
                </span>

              </div>

              <div className="stat">

                <b>
                  📅 {weekDone}/7
                </b>

                <span>
                  This week
                </span>

              </div>

            </section>

            {/* =============================================
               TOOLBAR
               ============================================= */}

            <section className="toolbar">

              <button
                className="nav"
                onClick={() =>
                  setSelectedDate(
                    shift(
                      selectedDate,
                      -1
                    )
                  )
                }
                aria-label="Previous day"
              >
                ‹
              </button>

              <div className="datebox">

                <strong>
                  {pretty(
                    selectedDate
                  )}
                </strong>

                <small>

                  {selectedDate ===
                  today
                    ? 'Today in New Zealand'
                    : selectedDate <
                        today
                      ? 'Past workout'
                      : 'Future workout'}

                </small>

              </div>

              <button
                className="nav"
                onClick={() =>
                  setSelectedDate(
                    shift(
                      selectedDate,
                      1
                    )
                  )
                }
                aria-label="Next day"
              >
                ›
              </button>

              <button
                className="ghost"
                onClick={() =>
                  setSelectedDate(
                    today
                  )
                }
              >
                Today
              </button>

              <input
                className="date-input"
                type="date"
                value={
                  selectedDate
                }
                onChange={(e) =>
                  setSelectedDate(
                    e.target.value
                  )
                }
              />

              <button
                className="primary small complete-button"
                onClick={() => plan.recovery ? setExercise(0, !selectedComplete) : completeAll()}
              >
                {plan.recovery
                  ? (selectedComplete ? 'Rest day completed ✓' : 'Mark rest day complete')
                  : (selectedComplete ? 'Completed ✓' : 'Complete all')}
              </button>

            </section>

            {/* =============================================
               MAIN LAYOUT
               ============================================= */}

            <div className="layout">

              {/* ===========================================
                 WORKOUT CARD
                 =========================================== */}

              <section className="card main-card">

                <div className="main-top">

                  <div>

                    <div className="day-label">
                      {selectedName}
                    </div>

                    <h2>
                      {plan.focus}
                    </h2>

                  </div>

                  <div className="progress-box">

                    <span>
                      {plan.recovery ? 'REST' : `${checked.length}/${plan.items.length}`}
                    </span>

                    <div className="progress">

                      <i
                        style={{
                          width:
                            `${progress}%`,
                        }}
                      />

                    </div>

                    <small>
                      {plan.recovery ? 'Take time to recover' : `${progress}% complete`}
                    </small>

                  </div>

                </div>

                <div className="session-meta">
                  <span>{plan.recovery ? 'RECOVERY SESSION' : `${plan.items.length} MOVEMENTS`}</span>
                  <span>{plan.cardio ? '＋ 20 MIN CARDIO' : plan.recovery ? 'REST DAY' : 'CONTROLLED REPS'}</span>
                </div>

                {/* =========================================
                   EXERCISE GRID
                   ========================================= */}

                {loading ? (

                  <div className="loading">
                    Loading your history…
                  </div>

                ) : (

                  plan.recovery ? (
                    <div className="recovery-panel">
                      <div className="recovery-intro">
                        <span className="recovery-symbol" aria-hidden="true">☾</span>
                        <div>
                          <h3>A day to recharge.</h3>
                          <p>No workout or exercise images today. Rest is part of the programme.</p>
                        </div>
                      </div>
                      <div className="recovery-tips">
                        <div><b>Sleep</b><span>Aim for 7–9 hours and give your body time to recover.</span></div>
                        <div><b>Nutrition</b><span>Eat consistently and keep up your normal protein intake.</span></div>
                        <div><b>Hydration</b><span>Drink water regularly throughout the day.</span></div>
                        <div><b>Optional movement</b><span>Easy walking or gentle mobility only if it feels comfortable.</span></div>
                      </div>
                      <button
                        type="button"
                        className={`recovery-toggle ${selectedComplete ? 'is-complete' : ''}`}
                        role="checkbox"
                        aria-checked={selectedComplete}
                        onClick={() => setExercise(0, !selectedComplete)}
                      >
                        <span className="recovery-checkbox" aria-hidden="true">{selectedComplete ? '✓' : ''}</span>
                        <span><b>{selectedComplete ? 'Rest day marked complete' : 'Mark rest day as complete'}</b><small>You can switch this on or off at any time.</small></span>
                      </button>
                    </div>
                  ) : (
                  <div className="reprise-exercise-grid">

                    {plan.items.map(
                      (
                        item,
                        index
                      ) => {

                        const isDone =
                          checked.includes(
                            index
                          );

                        const image = item.image;

                        return (

                          <div
                            key={
                              item.name
                            }
                            className={`reprise-exercise-card ${
                              isDone
                                ? 'is-done'
                                : ''
                            }`}
                          >

                            {/* ===========================
                               IMAGE
                               =========================== */}

                            {!plan.recovery && (

                              <a
                                className="reprise-image-link"
                                href={
                                  image
                                }
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open reference image for ${item.name}`}
                                onClick={(
                                  e
                                ) =>
                                  e.stopPropagation()
                                }
                                onMouseDown={(
                                  e
                                ) =>
                                  e.stopPropagation()
                                }
                              >

                                <img
                                  className="reprise-exercise-image"
                                  src={
                                    image
                                  }
                                  alt={`${item.name} reference`}
                                />

                              </a>

                            )}

                            {/* ===========================
                               EXERCISE INFO
                               =========================== */}

                            <label className={`reprise-exercise-info ${plan.recovery ? 'recovery-info' : ''}`}>

                              {!plan.recovery && (
                                <>
                                  <input
                                    type="checkbox"
                                    checked={isDone}
                                    onChange={(e) => setExercise(index, e.target.checked)}
                                    aria-label={`Mark ${item.name} complete`}
                                  />
                                  <span className="reprise-check" aria-hidden="true">✓</span>
                                </>
                              )}

                              <div className="reprise-exercise-details">

                                <b>
                                  {
                                    item.name
                                  }
                                </b>

                                <small>
                                  {item.target} <span className="exercise-intensity">{item.intensity}</span>
                                </small>
                                <p className="exercise-cue">{item.cue}</p>

                              </div>

                            </label>

                          </div>

                        );
                      }
                    )}

                  </div>
                  )

                )}

                {/* =========================================
                   SUCCESS MESSAGE
                   ========================================= */}

                {selectedComplete && !plan.recovery && (
                  <div className="success">
                    🎉 Workout complete! Great work — every exercise for this day is done.
                  </div>
                )}

                {/* =========================================
                   RULES
                   ========================================= */}

                <div className="rules">

                  <b>

                    {plan.recovery ? 'Recovery guidance' : 'Training notes'}

                  </b>

                  <br />

                  {plan.guidance}
                  {plan.cardio && <><br /><br /><b>Cardio finisher</b><br />{plan.cardio}</>}
                  {!plan.recovery && <><br /><br /><span className="effort-note">*The source programme prescribes failure on some isolation sets. Treat this as a target only when technique stays controlled; stop for pain or form breakdown. You do not need to force unsafe reps.</span></>}

                </div>

              </section>

              {/* ===========================================
                 WEEKLY OVERVIEW
                 =========================================== */}

              <aside className="card side-card">

                <h3>
                  Weekly overview
                </h3>

                <div className="week">

                  {weekDates.map(
                    (date) => (

                      <button
                        key={date}
                        className={`week-day ${
                          date ===
                          selectedDate
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          setSelectedDate(
                            date
                          )
                        }
                      >

                        <span>
                          {dayName(
                            date
                          ).slice(
                            0,
                            3
                          )}
                        </span>

                        <strong>
                          {dateObj(
                            date
                          ).getUTCDate()}
                        </strong>

                        <i
                          className={
                            allCompletedDates.has(
                              date
                            )
                              ? 'done-dot'
                              : ''
                          }
                        >
                          {allCompletedDates.has(
                            date
                          )
                            ? '✓'
                            : ''}
                        </i>

                      </button>

                    )
                  )}

                </div>

                <p>
                  A day becomes
                  complete only when
                  every task for that
                  day is checked.
                  Future days can be
                  planned ahead without
                  changing your current
                  streak.
                </p>

                <button
                  className="danger"
                  onClick={
                    resetAll
                  }
                >
                  Reset all saved
                  progress
                </button>

              </aside>

            </div>

          </>

        )}

      </div>

    </main>
  );
}