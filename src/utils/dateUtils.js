// dateUtils.js — ISO-8601 week/date helpers.
// ISO rule: weeks start Monday; week 1 is the week containing Jan 4 (i.e. the
// first week with a Thursday in the new year). Some ISO years have 53 weeks.

/**
 * ISO 8601 week number for a date (1..53). Week starts Monday; week 1
 * contains Jan 4.
 * @param {Date} date
 * @returns {number}
 */
export function getWeekNumber(date) {
  // Copy and normalize to UTC midnight to avoid DST/timezone drift.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // ISO weekday: Mon=1 .. Sun=7.
  const dayNum = d.getUTCDay() || 7;
  // Shift to the Thursday of this week — the Thursday determines the ISO year.
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/**
 * The ISO year a date belongs to (can differ from calendar year near
 * Dec/Jan boundaries). Pairs with getWeekNumber.
 * @param {Date} date
 * @returns {number}
 */
export function getISOYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/**
 * The Monday (local Date) of a given ISO year + week.
 * @param {number} year ISO year
 * @param {number} weekNum ISO week (1..53)
 * @returns {Date} local Date at midnight on that Monday
 */
export function getMondayOfWeek(year, weekNum) {
  // Jan 4 is always in ISO week 1.
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7; // Mon=1..Sun=7
  // Monday of week 1.
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - (jan4Day - 1));
  // Add (weekNum - 1) weeks.
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (weekNum - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Signed ISO-week distance between two (year, week) pairs.
 * Computed as the difference between the two Mondays divided by 7 — the
 * robust way that survives year boundaries and 53-week years.
 * Do NOT use (w2 - w1): week 52 -> week 1 is +1, not -51.
 * @returns {number} weeks from (y1,w1) to (y2,w2); negative if the second is earlier
 */
export function weeksBetween(y1, w1, y2, w2) {
  const m1 = getMondayOfWeek(y1, w1);
  const m2 = getMondayOfWeek(y2, w2);
  return Math.round((m2 - m1) / (7 * 86400000));
}

/**
 * "YYYY-MM-DD" for a local Date.
 * @param {Date} date
 * @returns {string}
 */
export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
