"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

/*
  ADMIN LOGIN

  On success we do nothing but let AuthContext update — the admin layout's
  effect notices `user && isLoginPage` and redirects to the dashboard. That
  keeps the redirect logic in one place.

  Firebase throws coded errors (auth/invalid-credential, auth/too-many-requests,
  …); we translate the common ones into friendly copy rather than leaking codes.
*/

function friendlyError(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password don't match. Please try again.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a minute and try again.";
    default:
      return "Could not sign in. Please try again.";
  }
}

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      // Redirect handled by the admin layout effect once `user` updates.
    } catch (err) {
      setError(friendlyError(err?.code));
      setSubmitting(false);
    }
  }

  return (
    <div data-theme="atelier" className="min-h-screen grid place-items-center floral-top px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-2xl text-white/90" style={{ fontFamily: "var(--font-dancing)" }}>
            Cozy with Anne
          </p>
          <h1 className="mt-1 text-xl font-semibold text-white">Studio admin</h1>
          <p className="mt-2 text-sm text-white/70">Sign in to manage your shop.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full admin-btn py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
