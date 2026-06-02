// ThemeContext — colour tokens delivered via CSS custom properties (not
// prop-drilled t/s like the old app), plus:
//  - personal dark/light preference in localStorage (per-device)
//  - global appearance (theme default, background image/colour) from
//    config/appearance, coordinator-set, applies to everyone.

import { createContext, useContext, useEffect, useState } from 'react';
import { paths, subscribe } from '../firebase/storage.js';
import { defaultAppearance } from '../utils/dataUtils.js';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'teampulse:theme';

// Named colour tokens per mode. Applied as --tp-* CSS variables on <html>.
const TOKENS = {
  light: {
    bg: '#f4f6f9',
    surface: '#ffffff',
    border: '#dbe1e8',
    text: '#1b2733',
    textMuted: '#5b6b7b',
    primary: '#1d4e6b',
    primaryText: '#ffffff',
    accent: '#2f8f6b',
    danger: '#b3402f',
  },
  dark: {
    bg: '#10161d',
    surface: '#1a232d',
    border: '#2c3947',
    text: '#e7edf3',
    textMuted: '#9aa9b8',
    primary: '#3a82ad',
    primaryText: '#ffffff',
    accent: '#46b888',
    danger: '#e0664f',
  },
};

function applyTokens(mode, appearance) {
  const root = document.documentElement;
  const tokens = TOKENS[mode] ?? TOKENS.light;
  for (const [k, v] of Object.entries(tokens)) {
    root.style.setProperty(`--tp-${k}`, v);
  }
  root.style.setProperty('--tp-bg-opacity', String(appearance?.bgImageOpacity ?? 1));
  root.style.setProperty(
    '--tp-bg-image',
    appearance?.bgImage ? `url("${appearance.bgImage}")` : 'none',
  );
  if (appearance?.customBgColor) {
    root.style.setProperty('--tp-bg', appearance.customBgColor);
  }
  root.dataset.theme = mode;
}

export function ThemeProvider({ children }) {
  const [appearance, setAppearance] = useState(defaultAppearance());
  // Personal preference wins for light/dark; null = follow the global default.
  const [personalMode, setPersonalMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY); // 'light' | 'dark' | null
  });

  // Live-subscribe to the coordinator-set global appearance.
  useEffect(() => {
    const unsub = subscribe(
      paths.appearance(),
      (data) => setAppearance(data ?? defaultAppearance()),
      defaultAppearance(),
    );
    return () => unsub();
  }, []);

  const mode = personalMode ?? appearance.theme ?? 'light';

  useEffect(() => {
    applyTokens(mode, appearance);
  }, [mode, appearance]);

  function setMode(next) {
    setPersonalMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function toggleMode() {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }

  const value = { mode, setMode, toggleMode, appearance };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
