// dataUtils.js — empty-state factories and default config fallbacks, so a
// fresh week/team/rotation works with zero setup.

import { weekKey } from './keys.js';
import { getWeekNumber, getISOYear } from './dateUtils.js';

/** A blank team week-counter document. */
export function makeEmptyWeek() {
  return { Beredningar: 0, Beslut: 0 };
}

/**
 * Initial rotation config. Three rotating pairs, three editable slot labels.
 * baseWeek/baseYear default to the current ISO week (rotation launches "this
 * week"). assignments map each pair to a starting slot so all three slots are
 * covered in week 0.
 *
 * Pair keys must match keys.pairKeyForGroup(group) for the seeded groups.
 * @param {string[]} pairKeys e.g. ["pair_g1_g2", "pair_g3_g4", "pair_g5_g6"]
 */
export function defaultRotation(pairKeys = []) {
  const now = new Date();
  const assignments = {};
  pairKeys.forEach((pk, i) => {
    assignments[pk] = i % 3;
  });
  return {
    baseYear: getISOYear(now),
    baseWeek: getWeekNumber(now),
    slots: [
      'Beredning',
      'Beslut',
      'Rekrytera + sökandesammanställningar + Beredningar',
    ],
    assignments,
    overrides: {},
    manualTasks: {},
  };
}

/** Default appearance config (used until a coordinator sets one). */
export function defaultAppearance() {
  return {
    theme: 'light',
    bgImage: null,
    bgImageOpacity: 1,
    customBgColor: null,
  };
}

/** Current ISO { year, weekNum } for initializing the week picker. */
export function currentWeek() {
  const now = new Date();
  return { year: getISOYear(now), weekNum: getWeekNumber(now) };
}

export { weekKey };
