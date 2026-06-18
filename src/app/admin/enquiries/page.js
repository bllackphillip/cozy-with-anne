"use client";

import { useEffect, useState } from "react";
import { getEnquiries, updateEnquiry, deleteEnquiry } from "@/lib/db";

/*
  ENQUIRIES INBOX — the commission enquiries captured by /api/enquiry.

  Each enquiry has a status ("new" | "handled"). Anne can mark one handled
  (so the dashboard's "new" count goes down) or delete it. Writes are
  optimistic with rollback, matching the artworks list.
*/

function formatDate(ts) {
  if (!ts?.seconds) return "";
  return new Date(ts.seconds * 1000).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getEnquiries()
      .then(setEnquiries)
      .catch((err) => {
        console.error(err);
        setError("Could not load enquiries. Check your Firestore rules allow owner reads.");
      });
  }, []);

  async function markHandled(enq) {
    const next = enq.status === "new" ? "handled" : "new";
    setEnquiries((prev) => prev.map((e) => (e.id === enq.id ? { ...e, status: next } : e)));
    try {
      await updateEnquiry(enq.id, { status: next });
    } catch (err) {
      console.error(err);
      setEnquiries((prev) => prev.map((e) => (e.id === enq.id ? { ...e, status: enq.status } : e)));
      setError("Could not update that enquiry.");
    }
  }

  async function remove(enq) {
    if (!window.confirm(`Delete the enquiry from ${enq.name}?`)) return;
    const snapshot = enquiries;
    setEnquiries((prev) => prev.filter((e) => e.id !== enq.id));
    try {
      await deleteEnquiry(enq.id);
    } catch (err) {
      console.error(err);
      setEnquiries(snapshot);
      setError("Could not delete that enquiry.");
    }
  }

  if (error && !enquiries) return <p className="text-red-600">{error}</p>;
  if (!enquiries) return <p className="text-gray-400">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>Enquiries</h1>
      <p className="mt-1 text-gray-500">
        {enquiries.filter((e) => e.status === "new").length} new ·{" "}
        {enquiries.length} total
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {enquiries.length === 0 ? (
        <p className="mt-8 text-sm text-gray-400">No enquiries yet. They&apos;ll appear here when someone uses the commission form.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {enquiries.map((e) => (
            <li
              key={e.id}
              className={`rounded-2xl border p-5 ${
                e.status === "new" ? "border-amber-200 bg-amber-50/40" : "border-green-200 bg-green-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{e.name}</p>
                  <a href={`mailto:${e.email}`} className="text-sm text-gray-500 hover:text-gray-800 break-all">
                    {e.email}
                  </a>
                </div>
                <span className="shrink-0 text-xs text-gray-400">{formatDate(e.createdAt)}</span>
              </div>

              <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{e.vision}</p>

              {e.attachmentUrl && (
                <a
                  href={e.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] underline hover:opacity-80"
                >
                  📎 View reference image
                </a>
              )}

              <div className="mt-4 flex items-center gap-3">
                <a
                  href={`mailto:${e.email}?subject=Re: your commission enquiry`}
                  className="admin-btn px-3 py-1.5 text-xs font-medium"
                >
                  Reply by email
                </a>
                <button
                  onClick={() => markHandled(e)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {e.status === "new" ? "Mark handled" : "Mark as new"}
                </button>
                <button
                  onClick={() => remove(e)}
                  className="ml-auto text-xs text-gray-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
