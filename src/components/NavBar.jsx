// NavBar — top navigation, week picker, theme toggle, sign-out. Admin link is
// shown only to coordinators (courtesy gate; rules are the real enforcement).

import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { IS_DEMO } from '../firebase/firebase.js';
import WeekPicker from './WeekPicker.jsx';

const links = [
  { to: '/', label: 'Översikt', end: true },
  { to: '/teams', label: 'Sektioner' },
  { to: '/schema', label: 'Schema' },
  { to: '/franvaro', label: 'Frånvaro' },
];

export default function NavBar() {
  const { profile, isCoordinator, signOut } = useAuth();
  const { mode, toggleMode } = useTheme();

  return (
    <header
      style={{
        background: 'var(--tp-surface)',
        borderBottom: '1px solid var(--tp-border)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        className="tp-shell"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <strong style={{ fontSize: '1.1rem' }}>TeamPulse</strong>
        {IS_DEMO && (
          <span
            title="Ingen Firebase konfigurerad — exempeldata i minnet, sparas inte."
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: 999,
              background: 'var(--tp-accent)',
              color: 'var(--tp-primaryText)',
            }}
          >
            DEMO
          </span>
        )}

        <nav style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              style={({ isActive }) => ({
                textDecoration: 'none',
                color: isActive ? 'var(--tp-primary)' : 'var(--tp-text)',
                fontWeight: isActive ? 700 : 400,
              })}
            >
              {l.label}
            </NavLink>
          ))}
          {isCoordinator && (
            <NavLink
              to="/admin"
              style={({ isActive }) => ({
                textDecoration: 'none',
                color: isActive ? 'var(--tp-primary)' : 'var(--tp-text)',
                fontWeight: isActive ? 700 : 400,
              })}
            >
              Administration
            </NavLink>
          )}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <WeekPicker />
          <button
            onClick={toggleMode}
            className="tp-btn"
            aria-label="Växla mörkt/ljust läge"
            title="Växla mörkt/ljust läge"
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="tp-muted" style={{ fontSize: '0.85rem' }}>
            {profile?.name}
          </span>
          <button onClick={signOut} className="tp-btn">
            Logga ut
          </button>
        </div>
      </div>
    </header>
  );
}
