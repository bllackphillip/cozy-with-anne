"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllArtworks, getEnquiries, getOrders } from "@/lib/db";

/*
  ADMIN DASHBOARD — at-a-glance overview.

  Fires the three reads in parallel (Promise.all) so the page paints as soon as
  the slowest one resolves rather than waterfalling. Everything below is just a
  summary of that data with quick links into the detail pages.
*/

function StatCard({ label, value, href, accent }) {
  const inner = (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${accent ?? "text-gray-900"}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getAllArtworks(), getEnquiries(), getOrders()])
      .then(([artworks, enquiries, orders]) => {
        setData({ artworks, enquiries, orders });
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load your data. Check your connection and Firestore rules.");
      });
  }, []);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-gray-400">Loading…</p>;
  }

  const { artworks, enquiries, orders } = data;
  const byCategory = (cat) => artworks.filter((a) => a.category === cat).length;
  const newEnquiries = enquiries.filter((e) => e.status === "new").length;
  const recent = enquiries.slice(0, 5);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl text-[var(--color-accent)]" style={{ fontFamily: "var(--font-fraunces)" }}>Welcome back, Anne</h1>
      <p className="mt-1 text-gray-500">Here&apos;s what&apos;s happening in your shop.</p>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Artworks" value={artworks.length} href="/admin/artworks" />
        <StatCard
          label="New enquiries"
          value={newEnquiries}
          href="/admin/enquiries"
          accent={newEnquiries > 0 ? "text-amber-600" : "text-gray-900"}
        />
        <StatCard label="Orders" value={orders.length} href="/admin/orders" />
        <StatCard
          label="Featured"
          value={artworks.filter((a) => a.featured).length}
          href="/admin/artworks"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard label="Oil paintings" value={byCategory("oil")} />
        <StatCard label="Digital art" value={byCategory("digital")} />
        <StatCard label="Sketches" value={byCategory("sketch")} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent enquiries</h2>
          <Link href="/admin/enquiries" className="text-sm text-gray-500 hover:text-gray-800">
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">No enquiries yet.</p>
        ) : (
          <ul className="mt-4 bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
            {recent.map((e) => (
              <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{e.name}</p>
                  <p className="text-sm text-gray-500 truncate">{e.vision}</p>
                </div>
                {e.status === "new" && (
                  <span className="shrink-0 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    new
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/admin/artworks/new"
          className="admin-btn px-4 py-2 text-sm font-medium"
        >
          + Add artwork
        </Link>
        <Link
          href="/admin/artworks"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Manage artworks
        </Link>
      </div>
    </div>
  );
}
