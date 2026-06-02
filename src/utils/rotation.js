// rotation.js — the weekly task rotation. Display-only: it tells a group what
// they're responsible for that week and never gates which counter a member may
// touch.
//
// Model: 3 rotating pairs x 3 task slots, period 3. The whole rotation is one
// number — weeks elapsed since the base week, mod 3.

import { weekKey, pairKeyForGroup } from './keys.js';
import { weeksBetween } from './dateUtils.js';

/**
 * Resolve each rotating pair's slot index for a given week.
 * @param {number} year ISO year
 * @param {number} weekNum ISO week
 * @param {object} rotation config/rotation document
 * @returns {Record<string, number>} pairKey -> slotIndex
 */
export function getAssignmentsForWeek(year, weekNum, rotation) {
  const key = weekKey(year, weekNum);

  // Per-week exception: use the stored assignment verbatim and do NOT shift the
  // ongoing cycle (overrides never re-base the rotation).
  if (rotation.overrides && rotation.overrides[key]) {
    return rotation.overrides[key];
  }

  const elapsed = weeksBetween(
    rotation.baseYear,
    rotation.baseWeek,
    year,
    weekNum,
  );

  // Negative-modulo guard: users navigate to weeks before the base, and JS `%`
  // returns negatives for negative inputs, which would pick the wrong slot.
  const shift = ((elapsed % 3) + 3) % 3;

  const result = {};
  for (const pairKey in rotation.assignments) {
    result[pairKey] = (rotation.assignments[pairKey] + shift) % 3;
  }
  return result;
}

/**
 * The task label to show for a group in a given week.
 * Rotating groups compute from the rotation; manual groups read manualTasks
 * (or "—" when unset).
 * @param {{id: string, rotating: boolean, pairWith?: string|null}} group
 * @param {number} year
 * @param {number} weekNum
 * @param {object} rotation
 * @param {string[]} slots
 * @returns {string}
 */
export function taskForGroup(group, year, weekNum, rotation, slots) {
  if (group.rotating) {
    const a = getAssignmentsForWeek(year, weekNum, rotation);
    const pairKey = pairKeyForGroup(group);
    const slotIndex = a[pairKey];
    return slots[slotIndex] ?? '—';
  }
  const key = weekKey(year, weekNum);
  return rotation.manualTasks?.[key]?.[group.id] ?? '—';
}
