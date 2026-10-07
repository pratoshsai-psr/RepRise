'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type Exercise = { name: string; target: string };
type Plan = { focus: string; items: Exercise[]; recovery?: boolean };

type LogMap = Record<string, number[]>;

const PLAN: Record<string, Plan> = {
  Monday: { focus: 'Chest + Triceps', items: [
    { name: 'Machine Chest Press', target: '3 × 8–12' },
    { name: 'Incline Machine Chest Press', target: '3 × 8–12' },
    { name: 'Machine Fly / Pec Deck', target: '3 × 10–15' },
    { name: 'Dumbbell Chest Fly', target: '2 × 10–15' },
    { name: 'Cable Triceps Pushdown', target: '3 × 10–15' },
    { name: 'Dumbbell Overhead Triceps Extension', target: '2 × 10–15' },
  ]},
  Tuesday: { focus: 'Back + Biceps', items: [
    { name: 'Lat Pulldown', target: '3 × 8–12' },
    { name: 'Seated Machine Row', target: '3 × 8–12' },
    { name: 'Chest-Supported Dumbbell Row', target: '3 × 10–12' },
    { name: 'Straight-Arm Pulldown', target: '2 × 10–15' },
    { name: 'Dumbbell Biceps Curl', target: '3 × 10–15' },
    { name: 'Dumbbell Hammer Curl', target: '2 × 10–15' },
  ]},
  Wednesday: { focus: 'Legs + Calves', items: [
    { name: 'Seated Leg Press', target: '3 × 8–12' },
    { name: 'Leg Extension', target: '3 × 10–15' },
    { name: 'Leg Curl', target: '3 × 10–15' },
    { name: 'Standing Calf Raise', target: '3 × 12–15' },
    { name: 'Goblet Squat', target: '2 × 10–12' },
  ]},
  Thursday: { focus: 'Shoulders + Chest', items: [
    { name: 'Seated Dumbbell Shoulder Press', target: '3 × 8–12' },
    { name: 'Dumbbell Lateral Raise', target: '3 × 10–15' },
    { name: 'Dumbbell Rear-Delt Fly', target: '3 × 10–15' },
    { name: 'Machine Chest Press', target: '3 × 10–12' },
    { name: 'Machine Fly / Pec Deck', target: '2 × 10–15' },
    { name: 'Cable Triceps Pushdown', target: '2 × 12–15' },
  ]},
  Friday: { focus: 'Back + Arms', items: [
    { name: 'Lat Pulldown', target: '3 × 10–12' },
    { name: 'Seated Machine Row', target: '3 × 10–12' },
    { name: 'Chest-Supported Dumbbell Row', target: '2 × 10–12' },
    { name: 'Dumbbell Biceps Curl', target: '3 × 10–15' },
    { name: 'Dumbbell Hammer Curl', target: '2 × 10–15' },
    { name: 'Cable Triceps Pushdown', target: '3 × 10–15' },
  ]},
  Saturday: { focus: 'Legs + Core + Cardio', items: [
    { name: 'Seated Leg Press', target: '3 × 10–12' },
    { name: 'Leg Extension', target: '2 × 10–15' },
    { name: 'Leg Curl', target: '3 × 10–15' },
    { name: 'Standing Calf Raise', target: '3 × 12–15' },
    { name: 'Machine Abdominal Crunch', target: '3 × 10–15' },
    { name: 'Treadmill Walking', target: '20–30 min' },
  ]},
  Sunday: { focus: 'Recovery', recovery: true, items: [
    { name: 'Treadmill / easy walk', target: '25–40 min' },
    { name: 'Gentle mobility', target: '5–10 min' },
  ]},
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const NZ_TZ = 'Pacific/Auckland';

function nzToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: NZ_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function dateObj(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); }
function dateStr(d: Date) { return d.toISOString().slice(0, 10); }
function shift(s: string, n: number) { const d = dateObj(s); d.setUTCDate(d.getUTCDate() + n); return dateStr(d); }
function dayName(s: string) { return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(dateObj(s)); }
function pretty(s: string) { return new Intl.DateTimeFormat('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dateObj(s)); }
function weekStart(s: string) { const d = dateObj(s); const mondayIndex = (d.getUTCDay() + 6) % 7; return shift(s, -mondayIndex); }
function sameOrBefore(a: string, b: string) { return a <= b; }

function AuthPanel({ email, setEmail, password, setPassword, mode, setMode, busy, error, onSubmit, onSignOut, userEmail }: {
  email: string; setEmail: (v: string) => void; password: string; setPassword: (v: string) => void;
  mode: 'signin' | 'signup'; setMode: (v: 'signin' | 'signup') => void; busy: boolean; error: string;
  onSubmit: () => void; onSignOut: () => void; userEmail: string | null;
}) {
  if (userEmail) return <div className="account"><span>Signed in as <b>{userEmail}</b></span><button className="ghost" onClick={onSignOut}>Sign out</button></div>;
  return <div className="auth-card">
    <div><div className="eyebrow">Cloud sync</div><h2>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2><p>Your workout history will follow you on phone, tablet and computer.</p></div>
    <div className="auth-fields"><input aria-label="Email" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><input aria-label="Password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><button className="primary" onClick={onSubmit} disabled={busy}>{busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button></div>
    {error && <div className="error">{error}</div>}
    <button className="link-button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
  </div>;
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(nzToday());
  const [logs, setLogs] = useState<LogMap>({});
  const [loading, setLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const today = nzToday();
  const selectedName = dayName(selectedDate);
  const plan = PLAN[selectedName];
  const checked = logs[selectedDate] ?? [];
  const progress = Math.round((checked.length / plan.items.length) * 100);
  const selectedComplete = checked.length === plan.items.length;

  const allCompletedDates = useMemo(() => new Set(Object.entries(logs).filter(([date, indices]) => sameOrBefore(date, today) && indices.length === PLAN[dayName(date)].items.length).map(([date]) => date)), [logs, today]);

  const streak = useMemo(() => {
    let d = today; let current = 0;
    if (!allCompletedDates.has(d)) d = shift(d, -1);
    while (allCompletedDates.has(d)) { current++; d = shift(d, -1); }
    return current;
  }, [allCompletedDates, today]);

  const bestStreak = useMemo(() => {
    const dates = [...allCompletedDates].sort(); let best = 0, run = 0, prev = '';
    for (const d of dates) { if (prev && shift(prev, 1) === d) run++; else run = 1; best = Math.max(best, run); prev = d; }
    return best;
  }, [allCompletedDates]);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => shift(weekStart(selectedDate), i)), [selectedDate]);
  const weekDone = weekDates.filter(d => allCompletedDates.has(d)).length;

  async function loadLogs(userId: string) {
    setLoading(true);
    const { data, error } = await supabase.from('workout_logs').select('workout_date, completed_exercises').eq('user_id', userId).order('workout_date', { ascending: true });
    if (error) { setAuthError(error.message); setLoading(false); return; }
    const next: LogMap = {};
    for (const row of data ?? []) next[row.workout_date] = Array.isArray(row.completed_exercises) ? row.completed_exercises.map(Number) : [];
    setLogs(next); setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const user = data.session?.user;
      setUserEmail(user?.email ?? null);
      if (user) await loadLogs(user.id); else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user;
      setUserEmail(user?.email ?? null);
      if (user) await loadLogs(user.id); else { setLogs({}); setLoading(false); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function authSubmit() {
    setAuthBusy(true); setAuthError('');
    const result = authMode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setAuthBusy(false);
    if (result.error) { setAuthError(result.error.message); return; }
    if (authMode === 'signup' && !result.data.session) setAuthError('Account created. Check your email to confirm it, then sign in.');
  }

  async function signOut() { await supabase.auth.signOut(); }

  async function setExercise(index: number, value: boolean) {
    if (!userEmail) return;
    const current = [...(logs[selectedDate] ?? [])];
    const next = value ? [...new Set([...current, index])] : current.filter(i => i !== index);
    setLogs(prev => ({ ...prev, [selectedDate]: next }));
    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;
    if (!user) return;
    const { error } = await supabase.from('workout_logs').upsert({ user_id: user.id, workout_date: selectedDate, completed_exercises: next }, { onConflict: 'user_id,workout_date' });
    if (error) setAuthError(error.message);
  }

  async function completeAll() {
    for (let i = 0; i < plan.items.length; i++) await setExercise(i, true);
  }

  async function resetAll() {
    if (!userEmail || !confirm('Reset all saved workout progress from your account?')) return;
    const { data: session } = await supabase.auth.getSession(); const user = session.session?.user;
    if (!user) return;
    const { error } = await supabase.from('workout_logs').delete().eq('user_id', user.id);
    if (error) setAuthError(error.message); else setLogs({});
  }

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return <main className="page">
    <div className="wrap">
      <header className="hero">
        <div><div className="eyebrow">Consistency over perfection</div><h1>My Workout Tracker</h1><p>Cloud-synced daily workouts, history and streaks.</p></div>
        <div className="nz-badge">🇳🇿 Auckland time</div>
      </header>

      <AuthPanel email={email} setEmail={setEmail} password={password} setPassword={setPassword} mode={authMode} setMode={setAuthMode} busy={authBusy} error={authError} onSubmit={authSubmit} onSignOut={signOut} userEmail={userEmail} />

      {userEmail && <>
        <section className="stats">
          <div className="stat"><b>🔥 {streak}</b><span>Current streak</span></div>
          <div className="stat"><b>🏆 {bestStreak}</b><span>Best streak</span></div>
          <div className="stat"><b>✅ {allCompletedDates.size}</b><span>Completed days</span></div>
          <div className="stat"><b>📅 {weekDone}/7</b><span>This week</span></div>
        </section>

        <section className="toolbar">
          <button className="nav" onClick={() => setSelectedDate(shift(selectedDate, -1))}>‹</button>
          <div className="datebox"><strong>{pretty(selectedDate)}</strong><small>{selectedDate === today ? 'Today in New Zealand' : selectedDate < today ? 'Past workout' : 'Future workout'}</small></div>
          <button className="nav" onClick={() => setSelectedDate(shift(selectedDate, 1))}>›</button>
          <button className="ghost" onClick={() => setSelectedDate(today)}>Today</button>
          <input className="date-input" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          <button className="primary small" onClick={completeAll}>Complete all</button>
        </section>

        <div className="layout">
          <section className="card main-card">
            <div className="main-top"><div><div className="day-label">{selectedName}</div><h2>{plan.focus}</h2></div><div className="progress-box"><span>{checked.length}/{plan.items.length}</span><div className="progress"><i style={{ width: `${progress}%` }} /></div><small>{progress}% complete</small></div></div>
            {loading ? <div className="loading">Loading your history…</div> : <div className="exercise-list">{plan.items.map((item, index) => <label key={item.name} className={`exercise ${checked.includes(index) ? 'done' : ''}`}><input type="checkbox" checked={checked.includes(index)} onChange={e => setExercise(index, e.target.checked)} /><span className="tick">✓</span><div><b>{item.name}</b><small>{item.target}</small></div></label>)}</div>}
            {selectedComplete && <div className="success">🎉 Day complete — streak rules will count it when that date arrives.</div>}
            <div className="rules"><b>{selectedName === 'Sunday' ? 'Recovery rules' : 'Session rules'}</b><br />{selectedName === 'Sunday' ? 'Treadmill / easy walk 25–40 minutes • gentle mobility 5–10 minutes • no hard weight training.' : 'Warm up 5–8 min • Rest 90–150 sec • Use controlled reps • No sharp pain • Increase weight only with clean form.'}</div>
          </section>

          <aside className="card side-card">
            <h3>Weekly overview</h3>
            <div className="week">{weekDates.map(d => <button key={d} className={`week-day ${d === selectedDate ? 'selected' : ''}`} onClick={() => setSelectedDate(d)}><span>{dayName(d).slice(0, 3)}</span><strong>{dateObj(d).getUTCDate()}</strong><i className={allCompletedDates.has(d) ? 'done-dot' : ''}>{allCompletedDates.has(d) ? '✓' : ''}</i></button>)}</div>
            <p>A day becomes complete only when every task for that day is checked. Future days can be planned ahead without changing your current streak.</p>
            <button className="danger" onClick={resetAll}>Reset all saved progress</button>
          </aside>
        </div>
      </>}
    </div>
  </main>;
}
