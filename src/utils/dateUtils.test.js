import { describe, it, expect } from 'vitest';
import {
  getWeekNumber,
  getISOYear,
  getMondayOfWeek,
  weeksBetween,
  toDateKey,
} from './dateUtils.js';
import { weekKey } from './keys.js';
import { getAssignmentsForWeek } from './rotation.js';

describe('ISO week number', () => {
  it('Jan 4 is always week 1', () => {
    expect(getWeekNumber(new Date(2026, 0, 4))).toBe(1);
    expect(getWeekNumber(new Date(2021, 0, 4))).toBe(1);
  });

  it('handles year-boundary belonging to previous ISO year', () => {
    // 2021-01-01 is a Friday -> ISO week 53 of 2020.
    const d = new Date(2021, 0, 1);
    expect(getWeekNumber(d)).toBe(53);
    expect(getISOYear(d)).toBe(2020);
  });

  it('2020 has 53 ISO weeks', () => {
    // 2020-12-31 is in ISO week 53.
    expect(getWeekNumber(new Date(2020, 11, 31))).toBe(53);
  });
});

describe('getMondayOfWeek', () => {
  it('returns a Monday', () => {
    const m = getMondayOfWeek(2026, 23);
    expect(m.getDay()).toBe(1); // Monday
  });

  it('round-trips with getWeekNumber', () => {
    const m = getMondayOfWeek(2026, 23);
    expect(getWeekNumber(m)).toBe(23);
    expect(getISOYear(m)).toBe(2026);
  });
});

describe('weeksBetween (across year boundaries)', () => {
  it('week 52 -> next year week 1 is +1, not -51', () => {
    // 2020 had 53 weeks: 2020-W53 -> 2021-W01 is +1.
    expect(weeksBetween(2020, 53, 2021, 1)).toBe(1);
  });

  it('is signed (past weeks are negative)', () => {
    expect(weeksBetween(2026, 23, 2026, 20)).toBe(-3);
  });

  it('is zero for the same week', () => {
    expect(weeksBetween(2026, 23, 2026, 23)).toBe(0);
  });
});

describe('rotation shift with negative-modulo guard', () => {
  const rotation = {
    baseYear: 2026,
    baseWeek: 23,
    slots: ['Beredning', 'Beslut', 'Bunt'],
    assignments: { pA: 0, pB: 1, pC: 2 },
    overrides: {},
    manualTasks: {},
  };

  it('base week = no shift', () => {
    expect(getAssignmentsForWeek(2026, 23, rotation)).toEqual({ pA: 0, pB: 1, pC: 2 });
  });

  it('+1 week shifts all pairs forward by one slot', () => {
    expect(getAssignmentsForWeek(2026, 24, rotation)).toEqual({ pA: 1, pB: 2, pC: 0 });
  });

  it('past week (before base) resolves correctly, not a negative slot', () => {
    // 1 week before base: shift should be 2 (i.e. -1 mod 3), never -1.
    expect(getAssignmentsForWeek(2026, 22, rotation)).toEqual({ pA: 2, pB: 0, pC: 1 });
  });

  it('override is used verbatim and does not shift the cycle', () => {
    const withOverride = {
      ...rotation,
      overrides: { [weekKey(2026, 25)]: { pA: 2, pB: 2, pC: 2 } },
    };
    expect(getAssignmentsForWeek(2026, 25, withOverride)).toEqual({ pA: 2, pB: 2, pC: 2 });
    // The week after the override still computes from the base (+3 -> no shift).
    expect(getAssignmentsForWeek(2026, 26, withOverride)).toEqual({ pA: 0, pB: 1, pC: 2 });
  });
});

describe('toDateKey', () => {
  it('zero-pads month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
