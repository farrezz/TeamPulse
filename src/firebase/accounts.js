// accounts.js — coordinator-driven account creation.
//
// Plan A: coordinators have individual accounts; members share one login.
// Creating an Auth account from the client normally signs the new user in,
// replacing the coordinator's session. To avoid that, we spin up a temporary
// secondary Firebase app, create the user there, then discard it — the
// coordinator's main session is never touched. No Cloud Functions needed, so
// this stays on the free Spark plan.

import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig, IS_DEMO } from './firebase.js';

/**
 * Create a Firebase Auth account without disturbing the current session.
 * @returns {Promise<string>} the new account's uid
 */
export async function createAccount(email, password) {
  if (IS_DEMO) {
    throw new Error('Konton kan inte skapas i demoläge — koppla Firebase först.');
  }
  const secondary = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  try {
    const secondaryAuth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await signOut(secondaryAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(secondary);
  }
}
