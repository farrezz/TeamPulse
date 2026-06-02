// AuthContext — Firebase Auth session + the signed-in user's own users/{uid}
// doc, plus the derived isCoordinator flag that gates all admin UI.
//
// role on the user doc is the trust anchor: the UI reads it to *show* controls,
// the Firestore rules read the same field to *allow* writes. Because users/* is
// coordinator-write-only, a member can never forge it.

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth, IS_DEMO } from '../firebase/firebase.js';
import { paths, subscribe } from '../firebase/storage.js';
import { DEMO_UID, DEMO_PROFILE } from '../firebase/demoStore.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null); // Firebase Auth user
  const [profile, setProfile] = useState(null); // users/{uid} doc
  const [loading, setLoading] = useState(true);

  // Track the auth session.
  useEffect(() => {
    if (IS_DEMO) return undefined; // demo: a fixed coordinator session below
    return onAuthStateChanged(auth, (u) => {
      setAuthUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
  }, []);

  // Demo: log in a fixed coordinator immediately, no Firebase Auth involved.
  useEffect(() => {
    if (!IS_DEMO) return undefined;
    // Async so it runs after component mounts, matching Firebase Auth timing.
    const timer = setTimeout(() => {
      setAuthUser({ uid: DEMO_UID });
      setProfile({ ...DEMO_PROFILE });
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Live-subscribe to the signed-in user's own profile doc.
  useEffect(() => {
    if (IS_DEMO || !authUser) return undefined;
    setLoading(true);
    const unsub = subscribe(paths.user(authUser.uid), (data) => {
      setProfile(data);
      setLoading(false);
    });
    return () => unsub();
  }, [authUser]);

  const value = {
    authUser,
    profile,
    uid: authUser?.uid ?? null,
    isCoordinator: profile?.role === 'coordinator',
    loading,
    signIn: (email, password) =>
      IS_DEMO ? Promise.resolve() : signInWithEmailAndPassword(auth, email, password),
    signOut: () => (IS_DEMO ? Promise.resolve() : fbSignOut(auth)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
