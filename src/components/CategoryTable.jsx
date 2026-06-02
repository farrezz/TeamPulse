// CategoryTable — a Mån–Fre per-day counter grid for one category of one team
// (e.g. Beredningar). Each row is a weekday with a +/- counter; the footer shows
// the week total.

import Counter from './Counter.jsx';
import { DAYS, dayArray, weekTotal } from '../utils/dataUtils.js';

export default function CategoryTable({
  title,
  teamId,
  year,
  weekNum,
  field,
  week,
  canEdit,
  allowExact,
}) {
  const arr = dayArray(week, field);
  const total = weekTotal(week, field);

  return (
    <div className="tp-card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--tp-textMuted)', fontSize: '0.8rem' }}>
            <th style={th}>Dag</th>
            <th style={{ ...th, textAlign: 'center' }}>{field}</th>
            <th style={{ ...th, textAlign: 'right' }}>Totalt</th>
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, i) => (
            <tr key={day}>
              <td style={td}>{day}</td>
              <td style={{ ...td, textAlign: 'center' }}>
                <div style={{ display: 'inline-flex' }}>
                  <Counter
                    teamId={teamId}
                    year={year}
                    weekNum={weekNum}
                    field={field}
                    dayIndex={i}
                    value={arr[i] ?? 0}
                    canEdit={canEdit}
                    allowExact={allowExact}
                  />
                </div>
              </td>
              <td style={{ ...td, textAlign: 'right' }}>{arr[i] ?? 0}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700 }}>
            <td style={td}>Totalt</td>
            <td style={{ ...td, textAlign: 'center' }}>{total}</td>
            <td style={{ ...td, textAlign: 'right', color: 'var(--tp-primary)' }}>{total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

const th = { padding: '0.4rem', borderBottom: '1px solid var(--tp-border)' };
const td = { padding: '0.4rem', borderBottom: '1px solid var(--tp-border)' };
