// GroupCard — one group, its members (mixed across teams), and its task for the
// active week. Coordinators get inline controls (the Administration page was
// removed): edit/add/remove/reassign members, set a manual group's weekly task,
// set a per-week rotation override, and delete an empty manual group.

import { paths, set, remove, adjust, newId } from '../firebase/storage.js';
import { getAssignmentsForWeek } from '../utils/rotation.js';
import { pairKeyForGroup, weekKey } from '../utils/keys.js';

export default function GroupCard({
  group,
  members,
  task,
  isCoordinator,
  teams = [],
  groups = [],
  year,
  weekNum,
  rotation,
}) {
  const canDelete = isCoordinator && !group.rotating && members.length === 0;

  async function deleteGroup() {
    if (!confirm(`Ta bort ${group.name}?`)) return;
    await remove(paths.group(group.id));
  }

  async function addMember() {
    await set(paths.user(newId()), {
      name: 'Ny medlem',
      role: 'member',
      teamId: teams[0]?.id ?? '',
      groupId: group.id,
      active: true,
    });
  }

  return (
    <div className="tp-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ margin: 0 }}>{group.name}</h2>
        <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!group.rotating && <span className="tp-muted" style={{ fontSize: '0.8rem' }}>Manuell</span>}
          {canDelete && (
            <button className="tp-text-link" onClick={deleteGroup} title="Ta bort tom grupp">✕</button>
          )}
        </span>
      </div>

      {/* Task line */}
      {group.rotating ? (
        <div style={{ margin: '0.5rem 0' }}>
          <span style={{ fontWeight: 600, color: 'var(--tp-primary)' }}>{task}</span>
          {isCoordinator && (
            <RotationOverride group={group} year={year} weekNum={weekNum} rotation={rotation} />
          )}
        </div>
      ) : isCoordinator ? (
        <ManualTaskInput group={group} year={year} weekNum={weekNum} rotation={rotation} />
      ) : (
        <p style={{ margin: '0.5rem 0', fontWeight: 600, color: 'var(--tp-primary)' }}>{task}</p>
      )}

      {/* Members */}
      {members.length === 0 && !isCoordinator ? (
        <p className="tp-muted" style={{ margin: 0 }}>Inga medlemmar.</p>
      ) : isCoordinator ? (
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          {members.map((m) => (
            <MemberRow key={m.id} member={m} teams={teams} groups={groups} />
          ))}
          <button className="tp-text-link" onClick={addMember} style={{ textAlign: 'left' }}>+ Medlem</button>
        </div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {members.map((m) => (
            <li key={m.id}>{m.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// One editable member: name, sektion, grupp, roll, remove.
function MemberRow({ member, teams, groups }) {
  function update(patch) {
    set(paths.user(member.id), patch, { merge: true });
  }
  function removeMember() {
    if (confirm(`Ta bort ${member.name}?`)) remove(paths.user(member.id));
  }

  return (
    <div className="tp-member">
      <div className="tp-member-top">
        <input
          className="tp-member-name"
          defaultValue={member.name}
          onBlur={(e) => e.target.value !== member.name && update({ name: e.target.value })}
          aria-label="Namn"
        />
        <button className="tp-text-link" onClick={removeMember} title="Ta bort medlem">✕</button>
      </div>
      <div className="tp-member-controls">
        <label className="tp-field">
          <span className="tp-field-label">Sektion</span>
          <select value={member.teamId} onChange={(e) => update({ teamId: e.target.value })}>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="tp-field">
          <span className="tp-field-label">Flytta till grupp</span>
          <select value={member.groupId} onChange={(e) => update({ groupId: e.target.value })}>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
        <label className="tp-field">
          <span className="tp-field-label">Roll</span>
          <select value={member.role} onChange={(e) => update({ role: e.target.value })}>
            <option value="member">Medlem</option>
            <option value="coordinator">Koordinator</option>
          </select>
        </label>
      </div>
    </div>
  );
}

// Manual group: set/clear this week's task. Saves on blur.
function ManualTaskInput({ group, year, weekNum, rotation }) {
  const wk = weekKey(year, weekNum);
  const current = rotation.manualTasks?.[wk]?.[group.id] ?? '';

  function save(value) {
    adjust(paths.rotation(), (cur) => {
      const r = cur ?? rotation;
      const manualTasks = { ...(r.manualTasks ?? {}) };
      const week = { ...(manualTasks[wk] ?? {}) };
      if (value.trim()) week[group.id] = value.trim();
      else delete week[group.id];
      manualTasks[wk] = week;
      return { ...r, manualTasks };
    });
  }

  return (
    <input
      defaultValue={current}
      key={wk + current}
      placeholder="Veckans uppgift…"
      onBlur={(e) => e.target.value !== current && save(e.target.value)}
      style={{ width: '100%', margin: '0.5rem 0', padding: '0.35rem', fontWeight: 600 }}
    />
  );
}

// Rotating group: override this week's slot for the pair (or revert to Auto).
function RotationOverride({ group, year, weekNum, rotation }) {
  const wk = weekKey(year, weekNum);
  const pairKey = pairKeyForGroup(group);
  const assignments = getAssignmentsForWeek(year, weekNum, rotation);
  const currentSlot = assignments[pairKey];
  const isOverridden = !!rotation.overrides?.[wk];

  function onChange(e) {
    const val = e.target.value;
    adjust(paths.rotation(), (cur) => {
      const r = cur ?? rotation;
      const overrides = { ...(r.overrides ?? {}) };
      if (val === 'auto') {
        delete overrides[wk];
      } else {
        // Store a full assignment map for the week so other pairs stay correct.
        overrides[wk] = { ...assignments, [pairKey]: Number(val) };
      }
      return { ...r, overrides };
    });
  }

  return (
    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
      <select value={isOverridden ? String(currentSlot) : 'auto'} onChange={onChange} style={sel} aria-label="Åsidosätt denna vecka">
        <option value="auto">Auto</option>
        {(rotation.slots ?? []).map((label, i) => (
          <option key={i} value={i}>{label}</option>
        ))}
      </select>
    </span>
  );
}

const sel = { padding: '0.2rem', fontSize: '0.8rem' };
