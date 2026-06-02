// WeekPicker — arrows + year/week dropdowns to view any week. Writes the shared
// active week in WeekContext. Navigation is purely client-side; week-keyed docs
// are read back per week.

import { useWeek } from '../context/WeekContext.jsx';
import { getMondayOfWeek, getWeekNumber, getISOYear } from '../utils/dateUtils.js';

// ISO years can have 52 or 53 weeks. Detect by checking Dec 28 (always in the
// last ISO week of its year).
function weeksInISOYear(year) {
  return getWeekNumber(new Date(year, 11, 28));
}

export default function WeekPicker() {
  const { year, weekNum, setWeek } = useWeek();

  function step(delta) {
    const monday = getMondayOfWeek(year, weekNum);
    monday.setDate(monday.getDate() + delta * 7);
    setWeek({ year: getISOYear(monday), weekNum: getWeekNumber(monday) });
  }

  const now = new Date();
  const thisYear = getISOYear(now);
  const years = [];
  for (let y = thisYear - 3; y <= thisYear + 3; y++) years.push(y);
  const maxWeek = weeksInISOYear(year);
  const weeks = Array.from({ length: maxWeek }, (_, i) => i + 1);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}
    >
      <button className="tp-btn" onClick={() => step(-1)} aria-label="Föregående vecka">
        ←
      </button>

      <label className="tp-muted" style={{ fontSize: '0.85rem' }}>
        Vecka
        <select
          value={weekNum}
          onChange={(e) => setWeek({ year, weekNum: Number(e.target.value) })}
          style={{ marginLeft: '0.35rem' }}
        >
          {weeks.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </label>

      <select
        value={year}
        onChange={(e) => {
          const ny = Number(e.target.value);
          const clamped = Math.min(weekNum, weeksInISOYear(ny));
          setWeek({ year: ny, weekNum: clamped });
        }}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <button className="tp-btn" onClick={() => step(1)} aria-label="Nästa vecka">
        →
      </button>
    </div>
  );
}
