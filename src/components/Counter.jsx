// Counter — a single per-day counter cell with +/- buttons. Case counts are
// tracked per weekday, so each cell targets one (field, dayIndex). All writes
// go through a transaction (storage.adjust) so simultaneous clicks never lose
// an increment. Coordinators may also type an exact value.

import { useState } from 'react';
import { paths, adjust } from '../firebase/storage.js';
import { makeEmptyWeek, dayArray } from '../utils/dataUtils.js';

export default function Counter({
  teamId,
  year,
  weekNum,
  field, // "Beredningar" | "Beslut"
  dayIndex, // 0 = Måndag … 4 = Fredag
  value,
  canEdit,
  allowExact = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function writeDay(nextValue) {
    return adjust(paths.teamWeek(teamId, year, weekNum), (current) => {
      const data = current ?? makeEmptyWeek();
      const arr = [...dayArray(data, field)];
      arr[dayIndex] = Math.max(0, nextValue);
      return { ...data, [field]: arr };
    });
  }

  async function bump(delta) {
    await writeDay(value + delta);
  }

  async function saveExact() {
    await writeDay(parseInt(draft, 10) || 0);
    setEditing(false);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <button className="tp-btn" disabled={!canEdit} onClick={() => bump(-1)} aria-label={`Minska ${field}`}>
        −
      </button>

      {allowExact && editing ? (
        <input
          type="number"
          min="0"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveExact}
          onKeyDown={(e) => e.key === 'Enter' && saveExact()}
          style={{ width: 56, padding: '0.3rem', textAlign: 'center' }}
        />
      ) : (
        <strong
          style={{ minWidth: 32, textAlign: 'center', cursor: allowExact ? 'pointer' : 'default' }}
          onClick={() => {
            if (allowExact) {
              setDraft(String(value));
              setEditing(true);
            }
          }}
          title={allowExact ? 'Klicka för att ange exakt värde' : undefined}
        >
          {value}
        </strong>
      )}

      <button className="tp-btn" disabled={!canEdit} onClick={() => bump(1)} aria-label={`Öka ${field}`}>
        +
      </button>
    </div>
  );
}
