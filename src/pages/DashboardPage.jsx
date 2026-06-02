// DashboardPage — the shared department overview (landing page).
// Beredningar goal widget and Beslut tally, stacked as two rows, live-rolled-up
// across all teams for the active week. The Beredningar goal is edited inline in
// the widget (coordinators only) — no separate editor box.

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

  function saveGoal(n) {
    set(paths.goal(year, weekNum), { Beredningar: Math.max(0, n) });
  }

  return (
    <>
      <h1>Avdelningsöversikt</h1>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <GoalWidget
          goal={goal}
          handled={totals.Beredningar}
          isCoordinator={isCoordinator}
          onSetGoal={saveGoal}
        />
        <BeslutTally total={totals.Beslut} />
      </div>
    </>
  );
}
