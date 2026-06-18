"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

/*
  AUTH CONTEXT

  Wraps Firebase Authentication so the admin area knows whether Anne is
  signed in. Only the back office (/admin/*) consumes this — the public
  storefront never needs a login.

  HOW IT WORKS:
  1. onAuthStateChanged is Firebase's subscription to the login state. It
     fires once on mount with the current user (or null), and again on every
     login / logout. Returning its unsubscribe function from the effect tears
     the listener down cleanly.
  2. `loading` stays true until that first callback resolves, so guarded
     pages can show a spinner instead of briefly flashing the login screen
     for an already-authenticated user (Firebase restores the session from
     IndexedDB asynchronously on a fresh page load).
  3. login()/logout() are thin wrappers returning the Firebase promises so
     the login form can await them and surface errors.

  SECURITY NOTE: being "signed in" here is only half the story. The real
  enforcement lives in the Firestore/Storage security rules, which check
  request.auth.uid against Anne's UID. This context just drives the UI; even
  if someone bypassed it, the rules would still reject their writes.
*/

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase's auth state. The callback runs asynchronously
    // (not during this effect's synchronous body), so updating state here is
    // the standard external-store subscription pattern, not a render-phase set.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password).then((cred) => {
      // Stamp the session start so the admin layout can enforce an absolute
      // session lifetime (Firebase would otherwise keep the session alive
      // indefinitely). See the auto-logout effect in src/app/admin/layout.js.
      if (typeof window !== "undefined") {
        localStorage.setItem("cwa-admin-login-at", String(Date.now()));
      }
      return cred;
    });
  }

  function logout() {
    if (typeof window !== "undefined") localStorage.removeItem("cwa-admin-login-at");
    return signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — components call useAuth() instead of useContext(AuthContext)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
