import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  documentId,
} from "firebase/firestore";

export async function getAllArtworks() {
  const snap = await getDocs(
    query(collection(db, "artworks"), orderBy("order"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getArtworkById(id) {
  const snap = await getDoc(doc(db, "artworks", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Fetches multiple artworks in a single Firestore read, preserving the given id order.
export async function getArtworksByIds(ids) {
  if (!ids.length) return [];
  const snap = await getDocs(
    query(collection(db, "artworks"), where(documentId(), "in", ids))
  );
  const map = Object.fromEntries(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
  return ids.map((id) => map[id]).filter(Boolean);
}

export async function getShopItems() {
  const snap = await getDocs(
    query(
      collection(db, "artworks"),
      where("category", "in", ["oil", "digital"]),
      orderBy("order")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getFeaturedArtworks() {
  // Equality-only query (no composite index needed); we sort client-side by a
  // dedicated `featuredOrder` so the carousel sequence is controllable
  // independently of the grid `order` (and falls back to `order` if unset).
  const snap = await getDocs(
    query(collection(db, "artworks"), where("featured", "==", true))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort(
      (a, b) =>
        (a.featuredOrder ?? a.order ?? 9999) - (b.featuredOrder ?? b.order ?? 9999)
    );
}

/* ───────────────────────────────────────────────────────────────────────────
   ADMIN WRITES

   These run from the back office in Anne's authenticated browser session.
   The client SDK attaches her auth token automatically, so the Firestore
   security rule `allow write: if isOwner()` lets them through; the same calls
   from any unauthenticated visitor are rejected by the rules.
   ──────────────────────────────────────────────────────────────────────────*/

// Create or fully overwrite an artwork document. `id` is the doc id (kebab-case).
export async function saveArtwork(id, data) {
  await setDoc(doc(db, "artworks", id), data);
}

// Patch a subset of fields on an existing artwork (e.g. toggle `featured`).
export async function updateArtwork(id, fields) {
  await updateDoc(doc(db, "artworks", id), fields);
}

export async function deleteArtwork(id) {
  await deleteDoc(doc(db, "artworks", id));
}

// Highest `order` currently in use — so a new artwork can append to the end.
export async function getMaxOrder() {
  const all = await getAllArtworks();
  return all.reduce((max, a) => Math.max(max, a.order ?? 0), 0);
}

/* ── Commission enquiries (read/manage in the inbox) ───────────────────────*/

export async function getEnquiries() {
  const snap = await getDocs(collection(db, "enquiries"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

export async function updateEnquiry(id, fields) {
  await updateDoc(doc(db, "enquiries", id), fields);
}

export async function deleteEnquiry(id) {
  await deleteDoc(doc(db, "enquiries", id));
}

/* ── Orders (read-only list; written by the Stripe webhook) ────────────────*/

export async function getOrders() {
  const snap = await getDocs(collection(db, "orders"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

// URL helper — pure function, no database call
export function getPortfolioPath(artwork) {
  const base = {
    oil:     "/portfolio/oil-paintings",
    digital: "/portfolio/digital-art",
    sketch:  "/portfolio/sketches",
  };
  return `${base[artwork.category] ?? "/portfolio"}/${artwork.id}`;
}
