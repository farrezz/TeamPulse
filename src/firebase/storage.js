// storage.js — the data-access layer. Everything reads/writes through here so
// paths, transactions, and merge semantics live in one place.
//
// Proven patterns carried from the old app:
//  - subscribe(): every live view subscribes via onSnapshot and cleans up.
//  - adjust(): all +/- counter writes go through a transaction so concurrent
//    clicks never lose an increment.
//  - merge writes / field paths for absence so simultaneous editors of the same
//    week document don't clobber each other.

import {
  doc,
  collection,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage, DEPARTMENT_ID, IS_DEMO } from './firebase.js';
import { weekKey, absenceKey } from '../utils/keys.js';
import {
  demoGet,
  demoSet,
  demoRemove,
  demoAdjust,
  demoSubscribe,
  demoMergeAbsence,
} from './demoStore.js';

// ── Path builders (single source of truth for the department subtree) ────────

// In demo mode, return mock refs that have a .path property (keyed by demoStore).
function mockDocRef(path) {
  return { path, type: 'doc', id: path.split('/').pop() };
}

function mockCollectionRef(path) {
  return { path, type: 'collection' };
}

const deptDoc = () =>
  IS_DEMO ? mockDocRef(`departments/${DEPARTMENT_ID}`) : doc(db, 'departments', DEPARTMENT_ID);

export const paths = {
  department: deptDoc,
  users: () => {
    const d = deptDoc();
    return IS_DEMO ? mockCollectionRef(`${d.path}/users`) : collection(d, 'users');
  },
  user: (uid) => {
    const d = deptDoc();
    return IS_DEMO ? mockDocRef(`${d.path}/users/${uid}`) : doc(d, 'users', uid);
  },
  teams: () => {
    const d = deptDoc();
    return IS_DEMO ? mockCollectionRef(`${d.path}/teams`) : collection(d, 'teams');
  },
  team: (teamId) => {
    const d = deptDoc();
    return IS_DEMO ? mockDocRef(`${d.path}/teams/${teamId}`) : doc(d, 'teams', teamId);
  },
  teamWeek: (teamId, year, weekNum) => {
    const d = deptDoc();
    const wk = weekKey(year, weekNum);
    return IS_DEMO
      ? mockDocRef(`${d.path}/teams/${teamId}/weeks/${wk}`)
      : doc(d, 'teams', teamId, 'weeks', wk);
  },
  goal: (year, weekNum) => {
    const d = deptDoc();
    const wk = weekKey(year, weekNum);
    return IS_DEMO ? mockDocRef(`${d.path}/goals/${wk}`) : doc(d, 'goals', wk);
  },
  groups: () => {
    const d = deptDoc();
    return IS_DEMO ? mockCollectionRef(`${d.path}/groups`) : collection(d, 'groups');
  },
  group: (groupId) => {
    const d = deptDoc();
    return IS_DEMO ? mockDocRef(`${d.path}/groups/${groupId}`) : doc(d, 'groups', groupId);
  },
  rotation: () => {
    const d = deptDoc();
    return IS_DEMO ? mockDocRef(`${d.path}/config/rotation`) : doc(d, 'config', 'rotation');
  },
  appearance: () => {
    const d = deptDoc();
    return IS_DEMO ? mockDocRef(`${d.path}/config/appearance`) : doc(d, 'config', 'appearance');
  },
  absence: (year, weekNum) => {
    const d = deptDoc();
    const wk = weekKey(year, weekNum);
    return IS_DEMO ? mockDocRef(`${d.path}/absence/${wk}`) : doc(d, 'absence', wk);
  },
};

// ── Generic primitives ───────────────────────────────────────────────────────

/** One-shot read of a document ref. Returns data or null. */
export async function get(ref) {
  if (IS_DEMO) return demoGet(ref.path);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/** Write/replace a document (merge optional). */
export async function set(ref, data, { merge = false } = {}) {
  if (IS_DEMO) return demoSet(ref.path, data, merge);
  await setDoc(ref, data, { merge });
}

/** Delete a document. */
export async function remove(ref) {
  if (IS_DEMO) return demoRemove(ref.path);
  await deleteDoc(ref);
}

/**
 * Subscribe to a document OR collection ref. Calls cb with:
 *  - for a doc: the data object (or `fallback` when the doc is absent)
 *  - for a collection: an array of { id, ...data }
 * Returns the unsubscribe function.
 */
export function subscribe(ref, cb, fallback = null) {
  if (IS_DEMO) return demoSubscribe(ref, cb, fallback);
  if (ref.type === 'collection') {
    return onSnapshot(ref, (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? snap.data() : fallback);
  });
}

/**
 * Atomic read-modify-write on a single document via a transaction.
 * `updater(current)` receives the current data (or null) and returns the new
 * full document data. Use for all counter +/- so concurrent clicks are safe.
 */
export async function adjust(ref, updater) {
  if (IS_DEMO) return demoAdjust(ref.path, updater);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? snap.data() : null;
    tx.set(ref, updater(current));
  });
}

// ── Domain helpers ────────────────────────────────────────────────────────────

/**
 * Merge-write absence cells for one week. `cells` is a map of
 * "{uid}-{day}" -> { type, note } | null. A null value clears that cell
 * (translated to a deleteField sentinel). Uses merge so it only touches the
 * targeted keys and never clobbers other people's entries already in that
 * week's document.
 */
export async function setAbsenceCells(year, weekNum, cells) {
  const ref = paths.absence(year, weekNum);
  if (IS_DEMO) return demoMergeAbsence(ref.path, cells);
  const payload = {};
  for (const [key, value] of Object.entries(cells)) {
    payload[key] = value === null ? deleteField() : value;
  }
  await setDoc(ref, payload, { merge: true });
}

/** Convenience: set a single absence cell (or clear it with value=null). */
export async function setAbsenceCell(year, weekNum, uid, dayIndex, value) {
  await setAbsenceCells(year, weekNum, { [absenceKey(uid, dayIndex)]: value });
}

/** Server timestamp sentinel for createdAt fields. */
export const timestamp = serverTimestamp;

/**
 * A fresh document id usable as a key for teams/groups (and demo users).
 * Works in both modes; Firestore ids are likewise opaque random strings.
 * Note: real Firebase users must be keyed by their Auth uid — see UserManager
 * plumbing note. In demo mode any id is fine.
 */
export function newId() {
  return 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Upload a background image to Storage; returns its download URL. */
export async function uploadImage(file) {
  if (IS_DEMO) return URL.createObjectURL(file); // local preview, no upload
  const path = `departments/${DEPARTMENT_ID}/appearance/${Date.now()}-${file.name}`;
  const r = storageRef(storage, path);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}
