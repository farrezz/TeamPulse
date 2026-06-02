// Sidebar — left navigation listing the sektioner so members can jump straight
// to any team's tracker. Live-subscribed, so a newly created sektion appears
// immediately. Coordinators can add a sektion and remove an empty one inline
// (the Administration page was folded into the app's surfaces).

import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { paths, subscribe, set, remove, newId, timestamp } from '../firebase/storage.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar() {
  const { isCoordinator } = useAuth();
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
    await set(paths.team(newId()), {
      name: name.trim(),
      order: teams.length,
      createdAt: timestamp(),
    });
    setName('');
  }

  async function removeTeam(team) {
    if (users.some((u) => u.teamId === team.id)) {
      alert('Sektionen har medlemmar. Flytta dem först.');
      return;
    }
    if (!confirm(`Ta bort ${team.name}?`)) return;
    await remove(paths.team(team.id));
  }

  return (
    <nav className="tp-sidebar" aria-label="Sektioner">
      <p className="tp-sidebar-heading">Sektioner</p>

      {teams.length === 0 ? (
        <p className="tp-muted" style={{ fontSize: '0.85rem' }}>Inga sektioner</p>
      ) : (
        teams.map((t) => (
          <div key={t.id} className="tp-side-row">
            <NavLink
              to={`/teams/${t.id}`}
              className={({ isActive }) => 'tp-side-link' + (isActive ? ' active' : '')}
            >
              {t.name}
            </NavLink>
            {isCoordinator && (
              <button
                className="tp-side-remove"
                title="Ta bort sektion"
                aria-label={`Ta bort ${t.name}`}
                onClick={() => removeTeam(t)}
              >
                ✕
              </button>
            )}
          </div>
        ))
      )}

      {isCoordinator && (
        <form onSubmit={addTeam} style={{ marginTop: '0.75rem' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="+ Sektion"
            aria-label="Ny sektion"
            style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
          />
        </form>
      )}
    </nav>
  );
}
