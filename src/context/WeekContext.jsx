// WeekContext — the active { year, weekNum } shared by every page so week
// navigation stays in sync across Dashboard, Tracker, Schedule and Absence.

import { createContext, useContext, useState } from 'react';
import { currentWeek } from '../utils/dataUtils.js';

const WeekContext = createContext(null);

export function WeekProvider({ children }) {
  const [week, setWeek] = useState(currentWeek);
  return (
    <WeekContext.Provider value={{ ...week, setWeek }}>
      {children}
    </WeekContext.Provider>
  );
}

export function useWeek() {
  const ctx = useContext(WeekContext);
  if (!ctx) throw new Error('useWeek must be used within a WeekProvider');
  return ctx;
}
