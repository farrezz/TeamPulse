// keys.js — single source of truth for all Firestore keys.
// Inconsistent key formats were a real bug source in the old app: never build
// a week key or pair key by hand anywhere else.

/**
 * Week key: zero-padded ISO week, e.g. "2026-23".
 * @param {number} year ISO year
 * @param {number} weekNum ISO week (1..53)
 * @returns {string}
 */
export function weekKey(year, weekNum) {
  return `${year}-${String(weekNum).padStart(2, '0')}`;
}

/**
 * Rotation pair key for a rotating group, e.g. "pair_1_2".
 * A group is paired with the partner stored in `pairWith`. The key is the two
 * group ids sorted, so both groups in a pair resolve to the same key.
 * @param {{id: string, pairWith?: string|null}} group
 * @returns {string}
 */
export function pairKeyForGroup(group) {
  if (!group.pairWith) return null;
  const [a, b] = [group.id, group.pairWith].sort();
  return `pair_${a}_${b}`;
}

/**
 * Absence cell key: "{uid}-{dayIndex}" where dayIndex 0=Mon .. 4=Fri.
 * @param {string} uid
 * @param {number} dayIndex 0..4
 * @returns {string}
 */
export function absenceKey(uid, dayIndex) {
  return `${uid}-${dayIndex}`;
}
