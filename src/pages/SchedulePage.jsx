// SchedulePage (Schema) — group cards in a two-column grid. Rotating groups'
// tasks are computed from the rotation; manual groups read from manualTasks.
//
// Coordinator controls are inline (the Administration page was removed):
//  - edit the three rotating slot labels (panel at top)
//  - add a manual group ("+ Grupp")
//  - per-card: edit/add/remove/reassign members, set a manual task, set a
//    per-week rotation override, delete an empty manual group (see GroupCard).

import { useEffect, useMemo, useState } from 'react';
import { useWeek } from '../context/WeekContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { paths, subscribe, set, adjust, newId } from '../firebase/storage.js';
import { defaultRotation } from '../utils/dataUtils.js';
import { taskForGroup, getAssignmentsForWeek } from '../utils/rotation.js';
import { pairKeyForGroup } from '../utils/keys.js';
import GroupCard from '../components/GroupCard.jsx';

export default function SchedulePage() {
  const { year, weekNum } = useWeek();
  const { isCoordinator } = useAuth();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rotation, setRotation] = useState(defaultRotation());

  useEffect(() => {
    const unsubGroups = subscribe(paths.groups(), (list) =>
      setGroups([...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))),
    );
    const unsubUsers = subscribe(paths.users(), setUsers);
    const unsubTeams = subscribe(paths.teams(), (list) =>
      setTeams([...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))),
    );
    const unsubRotation = subscribe(
      paths.rotation(),
      (data) => setRotation(data ?? defaultRotation()),
      defaultRotation(),
    );
    return () => {
      unsubGroups();
      unsubUsers();
      unsubTeams();
      unsubRotation();
    };
  }, []);

  async function addManualGroup() {
    const name = prompt('Namn på ny grupp?');
    if (!name?.trim()) return;
    await set(paths.group(newId()), {
      name: name.trim(),
      order: groups.length,
      rotating: false,
      pairWith: null,
    });
  }

  // Pair existing groups in order (1+2, 3+4, 5+6 …) into rotating pairs and
  // anchor the weekly rotation to the current week. If there are no groups yet,
  // create the canonical six. An odd leftover group stays manual.
  async function setupRotation() {
    if (!confirm('Para ihop grupperna i ordning (1+2, 3+4, 5+6) och starta veckorotation?')) return;

    let working = [...groups];
    if (working.length === 0) {
      const ids = Array.from({ length: 6 }, () => newId());
      working = ids.map((id, i) => ({
        id,
        name: `Grupp ${i + 1}`,
        order: i,
        pairWith: ids[i % 2 === 0 ? i + 1 : i - 1],
      }));
      await Promise.all(
        working.map((g) =>
          set(paths.group(g.id), { name: g.name, order: g.order, rotating: true, pairWith: g.pairWith }),
        ),
      );
    } else {
      const writes = [];
      for (let i = 0; i + 1 < working.length; i += 2) {
        const a = working[i];
        const b = working[i + 1];
        writes.push(set(paths.group(a.id), { name: a.name, order: a.order ?? i, rotating: true, pairWith: b.id }));
        writes.push(set(paths.group(b.id), { name: b.name, order: b.order ?? i + 1, rotating: true, pairWith: a.id }));
      }
      await Promise.all(writes);
      working = working.map((g, idx) => {
        const partner = working[idx % 2 === 0 ? idx + 1 : idx - 1];
        return partner ? { ...g, pairWith: partner.id } : g;
      });
    }

    const pairKeys = [];
    for (let i = 0; i + 1 < working.length; i += 2) {
      pairKeys.push(pairKeyForGroup({ id: working[i].id, pairWith: working[i + 1].id }));
    }
    const base = defaultRotation(pairKeys); // base week = current, default slots + assignments
    await set(paths.rotation(), {
      ...base,
      slots: rotation?.slots?.length ? rotation.slots : base.slots,
      overrides: rotation?.overrides ?? {},
      manualTasks: rotation?.manualTasks ?? {},
    });
  }

  const hasRotating = groups.some((g) => g.rotating);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Schema</h1>
        {isCoordinator && (
          <button className="tp-text-link" onClick={addManualGroup}>+ Grupp</button>
        )}
      </div>

      {isCoordinator && !hasRotating && (
        <div className="tp-card" style={{ marginTop: '1rem', borderColor: 'var(--tp-primary)' }}>
          <p style={{ margin: '0 0 0.5rem' }}>
            <strong>Rotationen är inte uppsatt.</strong> Grupperna byter inte uppgift automatiskt förrän de paras ihop.
          </p>
          <button className="tp-btn" onClick={setupRotation}>
            Para ihop grupperna (1+2, 3+4, 5+6) och starta veckorotation
          </button>
        </div>
      )}

      {isCoordinator && hasRotating && <SlotLabelEditor rotation={rotation} />}

      {isCoordinator && hasRotating && (
        <RotationStartEditor groups={groups} rotation={rotation} year={year} weekNum={weekNum} />
      )}

      {groups.length === 0 ? (
        <p className="tp-muted">Inga grupper än.</p>
      ) : (
        <div className="tp-schema-grid" style={{ marginTop: '1rem' }}>
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              members={users.filter((u) => u.groupId === group.id && u.active !== false && !u.system)}
              task={taskForGroup(group, year, weekNum, rotation, rotation.slots)}
              isCoordinator={isCoordinator}
              teams={teams}
              groups={groups}
              year={year}
              weekNum={weekNum}
              rotation={rotation}
            />
          ))}
        </div>
      )}
    </>
  );
}

// Coordinator-only: edit the three rotating slot labels. Stored in
// config/rotation.slots; affects every rotating group's displayed task.
function SlotLabelEditor({ rotation }) {
  const [slots, setSlots] = useState(rotation.slots ?? ['', '', '']);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSlots(rotation.slots ?? ['', '', '']);
  }, [rotation.slots]);

  async function save(e) {
    e.preventDefault();
    await adjust(paths.rotation(), (current) => ({
      ...(current ?? rotation),
      slots,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form className="tp-card" onSubmit={save} style={{ marginTop: '1rem' }}>
      <p className="tp-sidebar-heading">Roterande uppgifter (slot-etiketter)</p>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {slots.map((s, i) => (
          <input
            key={i}
            value={s}
            onChange={(e) => setSlots(slots.map((v, j) => (j === i ? e.target.value : v)))}
            placeholder={`Slot ${i}`}
            style={{ padding: '0.4rem 0.5rem' }}
          />
        ))}
      </div>
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button className="tp-text-link" type="submit" style={{ fontWeight: 700 }}>Spara</button>
        {saved && <span style={{ color: 'var(--tp-accent)', fontSize: '0.85rem' }}>Sparad!</span>}
      </div>
    </form>
  );
}

// Coordinator-only: set each pair's task for the active week and anchor the
// rotation here, so the cycle starts from this exact layout and rotates forward
// from this week. Clears any per-week overrides so the new base shows cleanly.
function RotationStartEditor({ groups, rotation, year, weekNum }) {
  const pairs = useMemo(() => {
    const rotating = groups
      .filter((g) => g.rotating)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const seen = new Set();
    const out = [];
    for (const g of rotating) {
      if (seen.has(g.id)) continue;
      const partner = groups.find((x) => x.id === g.pairWith);
      if (!partner) continue;
      seen.add(g.id);
      seen.add(partner.id);
      out.push({ key: pairKeyForGroup(g), label: `${g.name} & ${partner.name}` });
    }
    return out;
  }, [groups]);

  const [choice, setChoice] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = getAssignmentsForWeek(year, weekNum, rotation);
    const init = {};
    pairs.forEach((p) => { init[p.key] = current[p.key] ?? 0; });
    setChoice(init);
  }, [pairs, year, weekNum, rotation]);

  const slots = rotation.slots ?? [];

  async function commit(e) {
    e.preventDefault();
    if (!confirm(`Ankra rotationen till vecka ${weekNum} med dessa uppgifter?`)) return;
    await set(paths.rotation(), {
      ...rotation,
      baseYear: year,
      baseWeek: weekNum,
      assignments: { ...choice },
      overrides: {}, // re-anchoring clears one-week exceptions
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form className="tp-card" onSubmit={commit} style={{ marginTop: '1rem' }}>
      <p className="tp-sidebar-heading">Rotationsstart (vecka {weekNum})</p>
      <p className="tp-muted" style={{ marginTop: 0, fontSize: '0.85rem' }}>
        Välj uppgift per par och lås rotationen till den här veckan. Rotationen utgår sedan härifrån.
      </p>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {pairs.map((p) => (
          <label key={p.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <span>{p.label}</span>
            <select
              value={choice[p.key] ?? 0}
              onChange={(e) => setChoice({ ...choice, [p.key]: Number(e.target.value) })}
            >
              {slots.map((label, i) => (
                <option key={i} value={i}>{label}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button className="tp-btn" type="submit">Lås rotationen till denna vecka</button>
        {saved && <span style={{ color: 'var(--tp-accent)', fontSize: '0.85rem' }}>Sparad!</span>}
      </div>
    </form>
  );
}
