// AbsenceSummary — a quick week overview for the Frånvaro page: how many people
// are present vs absent each weekday, plus a headline count. Since absence is
// per-day, "working" is computed per weekday (present = total − absent that
// day), which is the honest estimate.

import { absenceKey } from '../utils/keys.js';

const SHORT_DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre'];

export default function AbsenceSummary({ users, absence }) {
  const total = users.length;

  const perDay = SHORT_DAYS.map((label, i) => {
    const absent = users.filter((u) => absence?.[absenceKey(u.id, i)]).length;
    return { label, absent, present: total - absent };
  });

  const absentThisWeek = users.filter((u) =>
    [0, 1, 2, 3, 4].some((i) => absence?.[absenceKey(u.id, i)]),
  ).length;

  return (
    <div className="tp-card" style={{ marginBottom: '1rem' }}>
      <p className="tp-sidebar-heading">Översikt denna vecka</p>
      <p style={{ margin: '0 0 0.75rem' }}>
        <strong>{total}</strong> personer · <strong>{absentThisWeek}</strong> med frånvaro
      </p>
      <div className="tp-summary-days">
        {perDay.map((d) => (
          <div key={d.label} className="tp-summary-day">
            <span className="tp-muted" style={{ fontSize: '0.75rem' }}>{d.label}</span>
            <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--tp-accent)' }}>
              {d.present}
            </span>
            <span className="tp-muted" style={{ fontSize: '0.75rem' }}>{d.absent} frånv.</span>
          </div>
        ))}
      </div>
    </div>
  );
}
