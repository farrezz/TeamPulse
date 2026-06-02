// SchedulePage (Schema) — organized by group in two columns. Rotating groups'
// tasks are computed from the rotation; manual groups read from manualTasks.
//
// Coordinator-only editing (slot labels, per-week override, manual-group task,
// add/delete group, reassign members) lives in the admin panels — TODO wire the
// inline coordinator controls described in PRD §7.4.

import { useEffect, useState } from 'react';
import { useWeek } from '../context/WeekContext.jsx';
import { paths, subscribe } from '../firebase/storage.js';
import { defaultRotation } from '../utils/dataUtils.js';
import { taskForGroup } from '../utils/rotation.js';
import GroupCard from '../components/GroupCard.jsx';

export default function SchedulePage() {
  const { year, weekNum } = useWeek();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [rotation, setRotation] = useState(defaultRotation());

  useEffect(() => {
    const unsubGroups = subscribe(paths.groups(), (list) =>
      setGroups([...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))),
    );
    const unsubUsers = subscribe(paths.users(), setUsers);
    const unsubRotation = subscribe(
      paths.rotation(),
      (data) => setRotation(data ?? defaultRotation()),
      defaultRotation(),
    );
    return () => {
      unsubGroups();
      unsubUsers();
      unsubRotation();
    };
  }, []);

  if (groups.length === 0) {
    return (
      <>
        <h1>Schema</h1>
        <p className="tp-muted">Inga grupper än.</p>
      </>
    );
  }

  return (
    <>
      <h1>Schema</h1>
      <div className="tp-grid-2">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            members={users.filter((u) => u.groupId === group.id && u.active !== false)}
            task={taskForGroup(group, year, weekNum, rotation, rotation.slots)}
          />
        ))}
      </div>
    </>
  );
}
