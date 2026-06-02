// demoStore.js — a tiny reactive in-memory Firestore stand-in for demo mode.
// Keyed by document path strings (the same paths the real refs expose via
// ref.path), so storage.js can branch to it with no change to pages/hooks.
//
// Supports the same surface storage.js needs: get, set (merge), remove,
// subscribe (doc + collection), adjust (read-modify-write), and absence merge.

import { DEPARTMENT_ID } from './firebase.js';
import { weekKey, pairKeyForGroup } from '../utils/keys.js';
import { currentWeek, defaultRotation } from '../utils/dataUtils.js';

const store = new Map(); // path -> data object
const listeners = new Map(); // path -> Set<{ type, cb, fallback }>

const DEPT = `departments/${DEPARTMENT_ID}`;
const { year, weekNum } = currentWeek();
const WK = weekKey(year, weekNum);

// ── The signed-in demo user (a working coordinator). Exported for AuthContext.
export const DEMO_UID = 'demo-user';
export const DEMO_PROFILE = {
  name: 'Du (Koordinator)',
  role: 'coordinator',
  teamId: 't1',
  groupId: 'g1',
  active: true,
};

// ── Path helpers (must match the real ref.path strings) ──────────────────────
const parentOf = (path) => path.slice(0, path.lastIndexOf('/'));

function collectionDocs(collPath) {
  const out = [];
  for (const [k, v] of store) {
    if (k.startsWith(collPath + '/')) {
      const rest = k.slice(collPath.length + 1);
      if (!rest.includes('/')) out.push({ id: rest, ...v });
    }
  }
  return out;
}

function valueFor(entry, path) {
  if (entry.type === 'collection') return collectionDocs(path);
  return store.has(path) ? store.get(path) : entry.fallback;
}

function emit(path) {
  const ls = listeners.get(path);
  if (!ls) return;
  for (const entry of ls) entry.cb(valueFor(entry, path));
}

// A write to a doc path notifies that doc and its parent collection.
function notify(docPath) {
  emit(docPath);
  emit(parentOf(docPath));
}

// ── Public demo operations (mirrors storage.js primitives) ────────────────────
export function demoGet(path) {
  return store.has(path) ? store.get(path) : null;
}

export function demoSet(path, data, merge) {
  const next = merge && store.has(path) ? { ...store.get(path), ...data } : { ...data };
  store.set(path, next);
  notify(path);
}

export function demoRemove(path) {
  store.delete(path);
  notify(path);
}

export function demoAdjust(path, updater) {
  const current = store.has(path) ? store.get(path) : null;
  store.set(path, updater(current));
  notify(path);
}

export function demoMergeAbsence(path, cells) {
  const existing = { ...(store.get(path) ?? {}) };
  for (const [k, v] of Object.entries(cells)) {
    if (v === null) delete existing[k];
    else existing[k] = v;
  }
  store.set(path, existing);
  notify(path);
}

export function demoSubscribe(ref, cb, fallback) {
  const path = ref.path;
  const entry = { type: ref.type, cb, fallback };
  if (!listeners.has(path)) listeners.set(path, new Set());
  listeners.get(path).add(entry);
  // Emit current value asynchronously, like onSnapshot.
  queueMicrotask(() => entry.cb(valueFor(entry, path)));
  return () => listeners.get(path)?.delete(entry);
}

// ── Seed sample data ──────────────────────────────────────────────────────────
function seed() {
  store.set(DEPT, { name: 'Avdelningen', createdAt: null });

  const teams = [
    { id: 't1', name: 'Sektion 1', order: 0 },
    { id: 't2', name: 'Sektion 2', order: 1 },
    { id: 't3', name: 'Sektion 3', order: 2 },
  ];
  teams.forEach((t) =>
    store.set(`${DEPT}/teams/${t.id}`, { name: t.name, order: t.order, createdAt: null }),
  );

  // Current-week counters — per-day arrays [Mån..Fre]. Beredningar sums to 18
  // across teams (so the department goal reads "18 av 25").
  store.set(`${DEPT}/teams/t1/weeks/${WK}`, { Beredningar: [8, 4, 0, 0, 0], Beslut: [5, 3, 0, 0, 0] });
  store.set(`${DEPT}/teams/t2/weeks/${WK}`, { Beredningar: [3, 2, 0, 0, 0], Beslut: [2, 1, 0, 0, 0] });
  store.set(`${DEPT}/teams/t3/weeks/${WK}`, { Beredningar: [1, 0, 0, 0, 0], Beslut: [0, 0, 0, 0, 0] });

  store.set(`${DEPT}/goals/${WK}`, { Beredningar: 25 });

  // Three rotating pairs (frozen set) + one manual group.
  const groups = [
    { id: 'g1', name: 'Grupp 1', order: 0, rotating: true, pairWith: 'g2' },
    { id: 'g2', name: 'Grupp 2', order: 1, rotating: true, pairWith: 'g1' },
    { id: 'g3', name: 'Grupp 3', order: 2, rotating: true, pairWith: 'g4' },
    { id: 'g4', name: 'Grupp 4', order: 3, rotating: true, pairWith: 'g3' },
    { id: 'g5', name: 'Grupp 5', order: 4, rotating: true, pairWith: 'g6' },
    { id: 'g6', name: 'Grupp 6', order: 5, rotating: true, pairWith: 'g5' },
  ];
  groups.forEach((g) =>
    store.set(`${DEPT}/groups/${g.id}`, {
      name: g.name,
      order: g.order,
      rotating: g.rotating,
      pairWith: g.pairWith,
    }),
  );

  const users = [
    { id: DEMO_UID, ...DEMO_PROFILE },
    { id: 'u2', name: 'Anna Andersson', role: 'member', teamId: 't1', groupId: 'g2', active: true },
    { id: 'u3', name: 'Björn Berg', role: 'member', teamId: 't2', groupId: 'g3', active: true },
    { id: 'u4', name: 'Cecilia Carlsson', role: 'member', teamId: 't2', groupId: 'g4', active: true },
    { id: 'u5', name: 'David Dahl', role: 'member', teamId: 't3', groupId: 'g5', active: true },
    { id: 'u6', name: 'Eva Ek', role: 'member', teamId: 't3', groupId: 'g6', active: true },
    { id: 'u7', name: 'Frida Falk', role: 'member', teamId: 't1', groupId: 'g1', active: true },
  ];
  users.forEach(({ id, ...data }) => store.set(`${DEPT}/users/${id}`, data));

  // Rotation anchored at the current week, pair keys matching the seeded groups.
  const pairKeys = [
    pairKeyForGroup({ id: 'g1', pairWith: 'g2' }),
    pairKeyForGroup({ id: 'g3', pairWith: 'g4' }),
    pairKeyForGroup({ id: 'g5', pairWith: 'g6' }),
  ];
  store.set(`${DEPT}/config/rotation`, defaultRotation(pairKeys));

  // A couple of pre-filled absence cells for the current week.
  store.set(`${DEPT}/absence/${WK}`, {
    'u2-0': { type: 'semester', note: '' },
    'u3-2': { type: 'ovrig', note: 'em' },
  });
}

seed();
