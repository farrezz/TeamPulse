// AbsencePage (Frånvaro) — Mon–Fri absence grid for the active week, plus the
// date-range tool for long vacations. Fully open: any member may read and write
// anyone's absence (no ownership restriction in UI or rules).

import { useEffect, useState } from 'react';
import { useWeek } from '../context/WeekContext.jsx';
import { paths, subscribe } from '../firebase/storage.js';
import AbsenceGrid, { TYPE_COLORS } from '../components/AbsenceGrid.jsx';
import AbsenceRangeTool from '../components/AbsenceRangeTool.jsx';

export default function AbsencePage() {
  const { year, weekNum } = useWeek();
  const [users, setUsers] = useState([]);
  const [absence, setAbsence] = useState({});

  useEffect(() => {
    const unsub = subscribe(paths.users(), (list) =>
      setUsers(list.filter((u) => u.active !== false).sort((a, b) => a.name.localeCompare(b.name, 'sv'))),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribe(paths.absence(year, weekNum), (data) => setAbsence(data ?? {}), {});
    return () => unsub();
  }, [year, weekNum]);

  return (
    <>
      <h1>Frånvaro</h1>

      <Legend />
      <AbsenceRangeTool users={users} />

      {users.length === 0 ? (
        <p className="tp-muted">Inga användare än.</p>
      ) : (
        <AbsenceGrid year={year} weekNum={weekNum} users={users} absence={absence} />
      )}
    </>
  );
}

function Legend() {
  const items = [
    { label: 'Semester', color: TYPE_COLORS.semester },
    { label: 'Övrig', color: TYPE_COLORS.ovrig },
  ];
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
      {items.map((i) => (
        <span key={i.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: i.color, display: 'inline-block' }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
