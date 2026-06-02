// AbsenceGrid — per-member Mon–Fri grid for the active week. Two types only
// (Semester, Övrig). A set cell reveals an inline note field for partial-day
// text; the note saves on blur (not per keystroke). Absence is fully open: any
// member may edit anyone's. All writes are merge / field-path writes so
// simultaneous editors of the same week don't clobber each other.

import { useState } from 'react';
import { setAbsenceCell } from '../firebase/storage.js';
import { absenceKey } from '../utils/keys.js';

const DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre'];
export const TYPE_COLORS = {
  semester: 'var(--tp-danger)',
  ovrig: 'var(--tp-textMuted)',
};
const TYPE_LABELS = { semester: 'Semester', ovrig: 'Övrig' };

export default function AbsenceGrid({ year, weekNum, users, absence }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
        <thead>
          <tr>
            <th style={cellStyle}>Person</th>
            {DAYS.map((d) => (
              <th key={d} style={cellStyle}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={{ ...cellStyle, textAlign: 'left' }}>{u.name}</td>
              {DAYS.map((_, dayIndex) => (
                <td key={dayIndex} style={cellStyle}>
                  <AbsenceCell
                    year={year}
                    weekNum={weekNum}
                    uid={u.id}
                    dayIndex={dayIndex}
                    entry={absence?.[absenceKey(u.id, dayIndex)] ?? null}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AbsenceCell({ year, weekNum, uid, dayIndex, entry }) {
  const [note, setNote] = useState(entry?.note ?? '');

  async function changeType(e) {
    const type = e.target.value;
    if (!type) {
      await setAbsenceCell(year, weekNum, uid, dayIndex, null);
      setNote('');
    } else {
      await setAbsenceCell(year, weekNum, uid, dayIndex, { type, note: entry?.note ?? '' });
    }
  }

  async function saveNote() {
    if (!entry) return; // no type set; nothing to attach a note to
    await setAbsenceCell(year, weekNum, uid, dayIndex, { type: entry.type, note });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 56 }}>
      <select
        value={entry?.type ?? ''}
        onChange={changeType}
        style={{
          background: entry ? TYPE_COLORS[entry.type] : 'transparent',
          color: entry ? '#ffffff' : 'inherit',
          borderRadius: 4,
          padding: '0.15rem 0.2rem',
          fontSize: '0.75rem',
        }}
      >
        <option value="">—</option>
        <option value="semester">{TYPE_LABELS.semester}</option>
        <option value="ovrig">{TYPE_LABELS.ovrig}</option>
      </select>
      {entry && (
        <input
          type="text"
          value={note}
          placeholder="fm/em/2h…"
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
          style={{ width: '100%', fontSize: '0.75rem', padding: '0.15rem' }}
        />
      )}
    </div>
  );
}

const cellStyle = {
  border: '1px solid var(--tp-border)',
  padding: '0.4rem',
  textAlign: 'center',
};
