// Counter — a single counter field with +/- buttons. All writes go through a
// transaction (storage.adjust) so two simultaneous clicks never lose an
// increment. Coordinators may also type an exact value.

import { useState } from 'react';
import { paths, adjust, set } from '../firebase/storage.js';
import { makeEmptyWeek } from '../utils/dataUtils.js';

export default function Counter({
  teamId,
  year,
  weekNum,
  field, // "Beredningar" | "Beslut"
  value,
  canEdit,
  allowExact = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  async function bump(delta) {
    await adjust(paths.teamWeek(teamId, year, weekNum), (current) => {
      const data = current ?? makeEmptyWeek();
      const next = Math.max(0, (data[field] ?? 0) + delta);
      return { ...data, [field]: next };
    });
  }

  async function saveExact() {
    const n = Math.max(0, parseInt(draft, 10) || 0);
    await adjust(paths.teamWeek(teamId, year, weekNum), (current) => ({
      ...(current ?? makeEmptyWeek()),
      [field]: n,
    }));
    setEditing(false);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
          style={{ width: 70, padding: '0.35rem', textAlign: 'center' }}
        />
      ) : (
        <strong
          style={{ minWidth: 40, textAlign: 'center', cursor: allowExact ? 'pointer' : 'default' }}
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
