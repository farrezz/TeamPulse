// NavBar — clean, minimal top navigation (Stockholm Design Lab inspired):
// monochrome, plain text links (no filled buttons), generous whitespace, a
// single hairline divider. Admin link shows only for coordinators (courtesy
// gate; rules are the real enforcement).

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

const linkClass = ({ isActive }) => 'tp-nav-link' + (isActive ? ' active' : '');

export default function NavBar() {
  const { profile, signOut } = useAuth();
  const { mode, toggleMode } = useTheme();

  return (
    <header className="tp-navbar">
      <div className="tp-brand">
        <span className="tp-brand-mark">NPB</span>
        <span className="tp-brand-sub">Malmö Karlskrona Nystartsjobb</span>
      </div>

      {IS_DEMO && (
        <span
          className="tp-demo-tag"
          title="Ingen Firebase konfigurerad — exempeldata i minnet, sparas inte."
        >
          Demo
        </span>
      )}

      <nav className="tp-nav-links">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="tp-navbar-right">
        <WeekPicker />
        <button
          onClick={toggleMode}
          className="tp-icon-btn"
          aria-label="Växla mörkt/ljust läge"
          title="Växla mörkt/ljust läge"
        >
          {mode === 'dark' ? '☀' : '☾'}
        </button>
        {profile?.name && <span className="tp-navbar-user">{profile.name}</span>}
        <button onClick={signOut} className="tp-text-link">
          Logga ut
        </button>
      </div>
    </header>
  );
}
