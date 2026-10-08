'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type Exercise = {
  name: string;
  target: string;
};

type Plan = {
  focus: string;
  items: Exercise[];
  recovery?: boolean;
};

type LogMap = Record<string, number[]>;

/* =========================================================
   WORKOUT PLAN
   ========================================================= */

const PLAN: Record<string, Plan> = {
  Monday: {
    focus: 'Chest + Triceps',
    items: [
      {
        name: 'Machine Chest Press',
        target: '3 × 8–12',
      },
      {
        name: 'Incline Machine Chest Press',
        target: '3 × 8–12',
      },
      {
        name: 'Machine Fly / Pec Deck',
        target: '3 × 10–15',
      },
      {
        name: 'Dumbbell Chest Fly',
        target: '2 × 10–15',
      },
      {
        name: 'Cable Triceps Pushdown',
        target: '3 × 10–15',
      },
      {
        name: 'Dumbbell Overhead Triceps Extension',
        target: '2 × 10–15',
      },
    ],
  },

  Tuesday: {
    focus: 'Back + Biceps',
    items: [
      {
        name: 'Lat Pulldown',
        target: '3 × 8–12',
      },
      {
        name: 'Seated Machine Row',
        target: '3 × 8–12',
      },
      {
        name: 'Chest-Supported Dumbbell Row',
        target: '3 × 10–12',
      },
      {
        name: 'Straight-Arm Pulldown',
        target: '2 × 10–15',
      },
      {
        name: 'Dumbbell Biceps Curl',
        target: '3 × 10–15',
      },
      {
        name: 'Dumbbell Hammer Curl',
        target: '2 × 10–15',
      },
    ],
  },

  Wednesday: {
    focus: 'Legs + Calves',
    items: [
      {
        name: 'Seated Leg Press',
        target: '3 × 8–12',
      },
      {
        name: 'Leg Extension',
        target: '3 × 10–15',
      },
      {
        name: 'Leg Curl',
        target: '3 × 10–15',
      },
      {
        name: 'Standing Calf Raise',
        target: '3 × 12–15',
      },
      {
        name: 'Goblet Squat',
        target: '2 × 10–12',
      },
    ],
  },

  Thursday: {
    focus: 'Shoulders + Chest',
    items: [
      {
        name: 'Seated Dumbbell Shoulder Press',
        target: '3 × 8–12',
      },
      {
        name: 'Dumbbell Lateral Raise',
        target: '3 × 10–15',
      },
      {
        name: 'Dumbbell Rear-Delt Fly',
        target: '3 × 10–15',
      },
      {
        name: 'Machine Chest Press',
        target: '3 × 10–12',
      },
      {
        name: 'Machine Fly / Pec Deck',
        target: '2 × 10–15',
      },
      {
        name: 'Cable Triceps Pushdown',
        target: '2 × 12–15',
      },
    ],
  },

  Friday: {
    focus: 'Back + Arms',
    items: [
      {
        name: 'Lat Pulldown',
        target: '3 × 10–12',
      },
      {
        name: 'Seated Machine Row',
        target: '3 × 10–12',
      },
      {
        name: 'Chest-Supported Dumbbell Row',
        target: '2 × 10–12',
      },
      {
        name: 'Dumbbell Biceps Curl',
        target: '3 × 10–15',
      },
      {
        name: 'Dumbbell Hammer Curl',
        target: '2 × 10–15',
      },
      {
        name: 'Cable Triceps Pushdown',
        target: '3 × 10–15',
      },
    ],
  },

  Saturday: {
    focus: 'Legs + Core + Cardio',
    items: [
      {
        name: 'Seated Leg Press',
        target: '3 × 10–12',
      },
      {
        name: 'Leg Extension',
        target: '2 × 10–15',
      },
      {
        name: 'Leg Curl',
        target: '3 × 10–15',
      },
      {
        name: 'Standing Calf Raise',
        target: '3 × 12–15',
      },
      {
        name: 'Machine Abdominal Crunch',
        target: '3 × 10–15',
      },
      {
        name: 'Treadmill Walking',
        target: '20–30 min',
      },
    ],
  },

  Sunday: {
    focus: 'Recovery',
    recovery: true,
    items: [
      {
        name: 'Treadmill / easy walk',
        target: '25–40 min',
      },
      {
        name: 'Gentle mobility',
        target: '5–10 min',
      },
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
   IMAGE HELPERS
   ========================================================= */

function slugifyExercise(
  name: string
) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-|-$/g,
      '');
}

function referenceImage(
  day: string,
  name: string
) {
  return `/workout-references/${day.toLowerCase()}/${slugifyExercise(
    name
  )}.png`;
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

  const checked =
    logs[selectedDate] ?? [];

  const progress =
    Math.round(
      (checked.length /
        plan.items.length) *
        100
    );

  const selectedComplete =
    checked.length ===
    plan.items.length;

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
              indices.length ===
                PLAN[
                  dayName(date)
                ].items.length
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

    const current = [
      ...(logs[
        selectedDate
      ] ?? []),
    ];

    const next =
      value
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

    const allIndices =
      plan.items.map(
        (_, index) =>
          index
      );

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

      <style jsx global>{`

        /* =================================================
           EXERCISE GRID
           ================================================= */

        .reprise-exercise-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 20px;
          margin-top: 24px;
        }

        /* =================================================
           EXERCISE CARD
           ================================================= */

        .reprise-exercise-card {
          position: relative;
          overflow: hidden;

          border: 1px solid
            rgba(255, 255, 255, 0.10);

          border-radius: 18px;

          background:
            rgba(255, 255, 255, 0.035);

          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .reprise-exercise-card:hover {
          transform:
            translateY(-3px);

          border-color:
            rgba(150, 100, 255, 0.55);

          background:
            rgba(255, 255, 255, 0.055);

          box-shadow:
            0 15px 35px
            rgba(0, 0, 0, 0.28);
        }

        /* =================================================
           COMPLETED CARD
           ================================================= */

        .reprise-exercise-card.is-done {
          border-color:
            rgba(34, 197, 94, 0.55);

          background:
            rgba(20, 120, 70, 0.10);
        }

        /* =================================================
           IMAGE
           ================================================= */

        .reprise-image-link {
          display: block;

          width: 100%;
          height: 235px;

          overflow: hidden;

          background: #ffffff;

          cursor: zoom-in;
        }

        .reprise-exercise-image {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;

          transition:
            transform 0.25s ease;
        }

        .reprise-exercise-card:hover
        .reprise-exercise-image {
          transform:
            scale(1.035);
        }

        /* =================================================
           INFO AREA
           ================================================= */

        .reprise-exercise-info {
          position: relative;

          display: flex;
          align-items: center;

          gap: 12px;

          min-height: 82px;

          padding:
            14px 15px 16px;

          cursor: pointer;
        }

        /* =================================================
           HIDE NATIVE CHECKBOX
           ================================================= */

        .reprise-exercise-info
        input[type="checkbox"] {
          position: absolute;

          opacity: 0;

          width: 1px;
          height: 1px;
        }

        /* =================================================
           CHECK BUTTON
           ================================================= */

        .reprise-check {
          flex:
            0 0 30px;

          width: 30px;
          height: 30px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 9px;

          border:
            1px solid
            rgba(255, 255, 255, 0.18);

          background:
            rgba(255, 255, 255, 0.07);

          color: transparent;

          font-size: 15px;

          font-weight: 800;

          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease;
        }

        .reprise-exercise-card.is-done
        .reprise-check {
          background: #22c55e;

          border-color: #22c55e;

          color: #ffffff;
        }

        /* =================================================
           TEXT
           ================================================= */

        .reprise-exercise-details {
          min-width: 0;

          display: flex;

          flex-direction: column;

          gap: 4px;
        }

        .reprise-exercise-details b {
          font-size: 15px;

          line-height: 1.3;
        }

        .reprise-exercise-details small {
          font-size: 12px;

          opacity: 0.65;
        }

        /* =================================================
           TABLET - 2 PER ROW
           ================================================= */

        @media (max-width: 1050px) {

          .reprise-exercise-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .reprise-image-link {
            height: 230px;
          }
        }

        /* =================================================
           MOBILE - 1 PER ROW
           ================================================= */

        @media (max-width: 650px) {

          .reprise-exercise-grid {
            grid-template-columns: 1fr;

            gap: 16px;
          }

          .reprise-image-link {
            height: 270px;
          }
        }

        /* =================================================
           SMALL MOBILE
           ================================================= */

        @media (max-width: 420px) {

          .reprise-image-link {
            height: 230px;
          }

          .reprise-exercise-info {
            min-height: 72px;

            padding:
              12px;
          }

          .reprise-exercise-details b {
            font-size: 14px;
          }
        }

      `}</style>

      <div className="wrap">

        {/* =================================================
           HEADER
           ================================================= */}

        <header className="hero">

          <div>

            <div className="eyebrow">
              Consistency over perfection
            </div>

            <h1>
              RepRise
            </h1>

            <p>
              Your workouts. Your
              progress. Every day.
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
                onClick={
                  completeAll
                }
                disabled={
                  selectedComplete
                }
              >
                {selectedComplete
                  ? 'Completed ✓'
                  : 'Complete all'}
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
                      {checked.length}/
                      {plan.items.length}
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
                      {progress}%
                      complete
                    </small>

                  </div>

                </div>

                {/* =========================================
                   EXERCISE GRID
                   ========================================= */}

                {loading ? (

                  <div className="loading">
                    Loading your history…
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

                        const image =
                          referenceImage(
                            selectedName,
                            item.name
                          );

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

                            {selectedName !==
                              'Sunday' && (

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

                            <label className="reprise-exercise-info">

                              <input
                                type="checkbox"
                                checked={
                                  isDone
                                }
                                onChange={(
                                  e
                                ) =>
                                  setExercise(
                                    index,
                                    e
                                      .target
                                      .checked
                                  )
                                }
                              />

                              <span className="reprise-check">
                                ✓
                              </span>

                              <div className="reprise-exercise-details">

                                <b>
                                  {
                                    item.name
                                  }
                                </b>

                                <small>
                                  {
                                    item.target
                                  }
                                </small>

                              </div>

                            </label>

                          </div>

                        );
                      }
                    )}

                  </div>

                )}

                {/* =========================================
                   SUCCESS MESSAGE
                   ========================================= */}

                {selectedComplete && (

                  <div className="success">

                    🎉 Workout
                    complete! Great
                    work — every
                    exercise for this
                    day is done.

                  </div>

                )}

                {/* =========================================
                   RULES
                   ========================================= */}

                <div className="rules">

                  <b>

                    {selectedName ===
                    'Sunday'
                      ? 'Recovery rules'
                      : 'Session rules'}

                  </b>

                  <br />

                  {selectedName ===
                  'Sunday'
                    ? 'Treadmill / easy walk 25–40 minutes • gentle mobility 5–10 minutes • no hard weight training.'
                    : 'Warm up 5–8 min • Rest 90–150 sec • Use controlled reps • No sharp pain • Increase weight only with clean form.'}

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