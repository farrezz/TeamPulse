// AbsenceRangeTool ("Frånvaroperiod") — mark a person absent across a date
// range in one operation (the easy path for long vacations). Open to everyone.
//
// Implementation per PRD §7.5: iterate every calendar day in the range, skip
// weekends, group days by their ISO week, and merge-write each affected week's
// absence document so the range write only touches the targeted "{uid}-{day}"
// keys and never clobbers other people's entries.

import { useState } from 'react';
import { setAbsenceCells } from '../firebase/storage.js';
import { getWeekNumber, getISOYear } from '../utils/dateUtils.js';
import { absenceKey, weekKey } from '../utils/keys.js';

export default function AbsenceRangeTool({ users }) {
  const [uid, setUid] = useState('');
  const [type, setType] = useState('semester');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [status, setStatus] = useState(null);

  async function apply(e) {
    e.preventDefault();
    if (!uid || !start || !end) return;
    const from = new Date(start);
    const to = new Date(end);
    if (to < from) {
      setStatus('Slutdatum är före startdatum.');
      return;
    }

    // Group target cells by ISO week key.
    const byWeek = {}; // weekKey -> { year, weekNum, cells: {} }
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay(); // 0=Sun..6=Sat
      if (dow === 0 || dow === 6) continue; // skip weekends (grid is Mon–Fri)
      const dayIndex = dow - 1; // Mon=0..Fri=4
      const year = getISOYear(d);
      const weekNum = getWeekNumber(d);
      const wk = weekKey(year, weekNum);
      if (!byWeek[wk]) byWeek[wk] = { year, weekNum, cells: {} };
      byWeek[wk].cells[absenceKey(uid, dayIndex)] = { type, note: '' };
    }

    const weeks = Object.values(byWeek);
    await Promise.all(weeks.map((w) => setAbsenceCells(w.year, w.weekNum, w.cells)));
    setStatus(`Sparad! Markerade ${weeks.length} vecka/veckor.`);
    setTimeout(() => setStatus(null), 2500);
  }

  return (
    <form className="tp-card" onSubmit={apply} style={{ marginBottom: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Frånvaroperiod</h3>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end' }}>
        <label>
          Person
          <br />
          <select value={uid} onChange={(e) => setUid(e.target.value)} required>
            <option value="">Välj…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </label>
        <label>
          Typ
          <br />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="semester">Semester</option>
            <option value="ovrig">Övrigt</option>
          </select>
        </label>
        <label>
          Från
          <br />
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
        </label>
        <label>
          Till
          <br />
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </label>
        <button className="tp-btn" type="submit">Markera</button>
        {status && <span style={{ color: 'var(--tp-accent)' }}>{status}</span>}
      </div>
    </form>
  );
}
