// TeamManager — coordinator-only. Add a sektion; remove one only when it has no
// members and no week data (app-side guard; the rule is the real enforcement).

import { useEffect, useState } from 'react';
import { doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.js';
import { paths, subscribe, set, remove, get, timestamp } from '../../firebase/storage.js';

export default function TeamManager() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    const u1 = subscribe(paths.teams(), (list) =>
      setTeams([...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))),
    );
    const u2 = subscribe(paths.users(), setUsers);
    return () => { u1(); u2(); };
  }, []);

  async function addTeam(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = doc(paths.teams()).id; // generate an id
    await set(paths.team(id), {
      name: name.trim(),
      order: teams.length,
      createdAt: timestamp(),
    });
    setName('');
  }

  async function removeTeam(team) {
    const hasMembers = users.some((u) => u.teamId === team.id);
    if (hasMembers) {
      alert('Sektionen har medlemmar. Flytta dem först.');
      return;
    }
    // Guard against existing week data (a coarse check on the team doc subtree
    // is not possible client-side without listing; we block on members here and
    // rely on the coordinator to confirm). TODO: optionally scan weeks subcollection.
    if (!confirm(`Ta bort ${team.name}?`)) return;
    await remove(paths.team(team.id));
  }

  return (
    <section className="tp-card" style={{ marginBottom: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Sektioner</h2>
      <form onSubmit={addTeam} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="t.ex. Sektion 4"
          style={{ padding: '0.5rem', flex: 1 }}
        />
        <button className="tp-btn" type="submit">Lägg till</button>
      </form>
      <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
        {teams.map((t) => (
          <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
            <span>{t.name}</span>
            <button className="tp-btn" onClick={() => removeTeam(t)}>Ta bort</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
