// DashboardPage — the shared department overview (landing page).
// Beredningar goal widget + Beslut tally, live-rolled-up across all teams for
// the active week. Coordinators get an inline goal editor.

import { useEffect, useState } from 'react';
import { useWeek } from '../context/WeekContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { paths, subscribe, set } from '../firebase/storage.js';
import { useTeamWeeks } from '../hooks/useTeamWeeks.js';
import GoalWidget from '../components/GoalWidget.jsx';
import BeslutTally from '../components/BeslutTally.jsx';

export default function DashboardPage() {
  const { year, weekNum } = useWeek();
  const { isCoordinator } = useAuth();
  const { totals } = useTeamWeeks(year, weekNum);
  const [goal, setGoal] = useState(null);

  useEffect(() => {
    const unsub = subscribe(paths.goal(year, weekNum), setGoal, null);
    return () => unsub();
  }, [year, weekNum]);

  return (
    <>
      <h1>Avdelningsöversikt</h1>
      <div className="tp-grid-2">
        <GoalWidget goal={goal} handled={totals.Beredningar} />
        <BeslutTally total={totals.Beslut} />
      </div>

      {isCoordinator && (
        <GoalEditor
          year={year}
          weekNum={weekNum}
          current={goal?.Beredningar ?? ''}
        />
      )}
    </>
  );
}

function GoalEditor({ year, weekNum, current }) {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(current === '' ? '' : String(current));
  }, [current, year, weekNum]);

  async function save(e) {
    e.preventDefault();
    const n = Math.max(0, parseInt(value, 10) || 0);
    await set(paths.goal(year, weekNum), { Beredningar: n });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form className="tp-card" onSubmit={save} style={{ marginTop: '1rem', maxWidth: 360 }}>
      <h3 style={{ marginTop: 0 }}>Sätt veckans Beredningar-mål</h3>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ padding: '0.5rem', width: 120 }}
        />
        <button className="tp-btn" type="submit">
          Spara
        </button>
        {saved && <span style={{ color: 'var(--tp-accent)' }}>Sparad!</span>}
      </div>
    </form>
  );
}
