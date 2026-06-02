// ThemeContext — personal dark/light theme, stored per-device in localStorage.
// Colour tokens are delivered as --tp-* CSS custom properties on <html> (no
// prop-drilling). There is no global/coordinator-set theme — each user picks
// their own. Defaults to the OS preference on first visit.

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'teampulse:theme';

// Named colour tokens per mode, carried over from the previous app's palette
// (warm-tinted light theme; deep indigo dark theme).
const TOKENS = {
  light: {
    bg: '#f5f4f1',
    surface: '#fdfcfa',
    surfaceAlt: '#f7f5f2',
    border: '#e0dbd5',
    text: '#334155',
    textStrong: '#0f172a',
    textMuted: '#6b6660',
    primary: '#3b5bdb',
    primaryText: '#ffffff',
    primarySoft: '#eef1ff',
    accent: '#16a34a',
    danger: '#dc2626',
    input: '#eeece8',
  },
  dark: {
    bg: '#141624',
    surface: '#1d2035',
    surfaceAlt: '#181b2e',
    border: '#272a40',
    text: '#c8cde0',
    textStrong: '#e8ecff',
    textMuted: '#7a82a0',
    primary: '#5b7fff',
    primaryText: '#ffffff',
    primarySoft: '#1a2040',
    accent: '#4ade80',
    danger: '#f87171',
    input: '#1a1e32',
  },
};

function applyTokens(mode) {
  const root = document.documentElement;
  const tokens = TOKENS[mode] ?? TOKENS.light;
  for (const [k, v] of Object.entries(tokens)) {
    root.style.setProperty(`--tp-${k}`, v);
  }
  root.dataset.theme = mode;
  // Make native controls (selects, date/color inputs, scrollbars) match.
  root.style.colorScheme = mode;
}

function initialMode() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(initialMode);

  useEffect(() => {
    applyTokens(mode);
  }, [mode]);

  function setMode(next) {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function toggleMode() {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
