"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveArtwork, deleteArtwork, getArtworkById, getMaxOrder } from "@/lib/db";
import ImageFolderManager from "@/components/admin/ImageFolderManager";

/*
  ARTWORK FORM — shared by the "new" and "edit" pages.

  It mirrors the Firestore document shape (see CLAUDE.md). The fields shown
  depend on the category, because the catalogue itself differs:
    • oil     → original (for sale) + prints + stickers
    • digital → prints + stickers (no original)
    • sketch  → metadata only (no commerce)

  IMAGES: managed only in edit mode. A brand-new artwork is saved first (which
  creates the document and fixes its Storage folder paths), then you land on the
  edit page to upload images into those folders. This avoids uploading files to
  a folder whose owning document doesn't exist yet.
*/

const DEFAULT_PRINTS = {
  sizes: [
    { label: "10×10 cm", price: 12 },
    { label: "15×15 cm", price: 18 },
    { label: "20×20 cm", price: 25 },
    { label: "30×30 cm", price: 35 },
  ],
  finishes: ["Matte", "Glossy"],
};

// Stickers are a single size; backgrounds are derived from uploaded images, so
// the form only edits the one size + price.
const DEFAULT_STICKER_SIZE = { label: "7 cm", price: 3 };
const STICKER_BACKGROUNDS = ["Backgroundless", "With background"];

/*
  Guard against partial or older documents. The print editor maps over
  sizes/finishes at render, so they MUST be arrays. If a stored doc is missing
  one (or has it malformed), fall back to the catalogue defaults rather than
  crash — saving the form then repairs the document.
*/
function normalizePrints(p) {
  return {
    sizes: Array.isArray(p?.sizes) && p.sizes.length ? p.sizes : DEFAULT_PRINTS.sizes,
    finishes: Array.isArray(p?.finishes) ? p.finishes : DEFAULT_PRINTS.finishes,
  };
}
// Tolerates the legacy shape (stickers.sizes[0]) and the missing-field case.
function normalizeStickerSize(s) {
  if (s?.size?.label) return { label: s.size.label, price: s.size.price ?? DEFAULT_STICKER_SIZE.price };
  const legacy = s?.sizes?.[0];
  if (legacy) return { label: legacy.label ?? DEFAULT_STICKER_SIZE.label, price: legacy.price ?? DEFAULT_STICKER_SIZE.price };
  return { ...DEFAULT_STICKER_SIZE };
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Canonical Storage folder paths for an artwork, matching the seeder convention.
function deriveFolders(id, category) {
  if (category === "sketch") return { originalFolder: `artworks/${id}` };
  return {
    originalFolder: `artworks/${id}/original`,
    printsFolder: `artworks/${id}/prints`,
    stickersFolder: `artworks/${id}/stickers`,
  };
}

function Label({ children }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}

export default function ArtworkForm({ mode, initial = null }) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.id ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [category, setCategory] = useState(initial?.category ?? "oil");
  const [medium, setMedium] = useState(initial?.medium ?? "");
  const [dimensions, setDimensions] = useState(initial?.dimensions ?? "");
  const [year, setYear] = useState(initial?.year ?? new Date().getFullYear());
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [keywords, setKeywords] = useState((initial?.keywords ?? []).join(", "));
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [featuredOrder, setFeaturedOrder] = useState(initial?.featuredOrder ?? "");
  const [order, setOrder] = useState(initial?.order ?? "");

  const [originalAvailable, setOriginalAvailable] = useState(initial?.original?.available ?? true);
  const [originalPrice, setOriginalPrice] = useState(initial?.original?.price ?? "");
  const [prints, setPrints] = useState(normalizePrints(initial?.prints));
  const [stickerSize, setStickerSize] = useState(normalizeStickerSize(initial?.stickers));

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const sellsPrints = category === "oil" || category === "digital";

  // On a new artwork, suggest the next display-order number (max in use + 1) so
  // Anne doesn't have to guess. Runs once; only fills if she hasn't typed one.
  useEffect(() => {
    if (isEdit) return;
    let active = true;
    getMaxOrder()
      .then((max) => {
        if (active) setOrder((cur) => (cur === "" ? max + 1 : cur));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isEdit]);

  function onTitleChange(value) {
    setTitle(value);
    if (!isEdit && !slugTouched) setSlug(slugify(value));
  }

  function setSizePrice(setter, sizes, i, value) {
    setter((prev) => ({
      ...prev,
      sizes: sizes.map((s, idx) => (idx === i ? { ...s, price: value } : s)),
    }));
  }

  function setSizeLabel(setter, sizes, i, value) {
    setter((prev) => ({
      ...prev,
      sizes: sizes.map((s, idx) => (idx === i ? { ...s, label: value } : s)),
    }));
  }

  function buildDoc() {
    const id = slug.trim();
    const doc = {
      title: title.trim(),
      category,
      medium: medium.trim() || "TBD",
      dimensions: dimensions.trim() || "TBD",
      year: Number(year) || new Date().getFullYear(),
      description: description.trim() || "TBD",
      tags: tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      keywords: keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
      featured: !!featured,
      featuredOrder: Number(featuredOrder) || 0,
      order: Number(order) || 0,
      ...deriveFolders(id, category),
    };
    if (category === "oil") {
      doc.original = { available: !!originalAvailable, price: Number(originalPrice) || 0 };
    }
    if (sellsPrints) {
      doc.prints = {
        sizes: prints.sizes.map((s) => ({ label: s.label.trim(), price: Number(s.price) || 0 })),
        finishes: prints.finishes.map((f) => f.trim()).filter(Boolean),
      };
      doc.stickers = {
        size: { label: stickerSize.label.trim() || DEFAULT_STICKER_SIZE.label, price: Number(stickerSize.price) || 0 },
        backgrounds: STICKER_BACKGROUNDS,
      };
    }
    return doc;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const id = slug.trim();
    if (!title.trim() || !id) {
      setError("A title and an ID are both required.");
      return;
    }

    setSaving(true);
    try {
      if (!isEdit) {
        const existing = await getArtworkById(id);
        if (existing) {
          setError("An artwork with this ID already exists — pick a different title or edit the ID.");
          setSaving(false);
          return;
        }
      }
      await saveArtwork(id, buildDoc());
      if (!isEdit) {
        router.push(`/admin/artworks/${id}`);
        return;
      }
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Could not save. Make sure you're signed in and your Firestore rules allow owner writes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${title}"? It will disappear from the site. (Image files in Storage are not removed automatically.)`
      )
    )
      return;
    setDeleting(true);
    setError(null);
    try {
      await deleteArtwork(initial.id);
      router.push("/admin/artworks");
    } catch (err) {
      console.error(err);
      setError("Could not delete this artwork.");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      {/* ── Core details ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Details</h2>

        <div>
          <Label>Title</Label>
          <input className={inputClass} value={title} onChange={(e) => onTitleChange(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>ID (used in the web address)</Label>
            <input
              className={`${inputClass} ${isEdit ? "bg-gray-100 text-gray-500" : ""}`}
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
              readOnly={isEdit}
              required
            />
            {isEdit && <p className="mt-1 text-xs text-gray-400">The ID can&apos;t be changed after creation.</p>}
          </div>
          <div>
            <Label>Category</Label>
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="oil">Oil painting</option>
              <option value="digital">Digital art</option>
              <option value="sketch">Sketch</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Medium</Label>
            <input className={inputClass} value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="Oil on canvas" />
          </div>
          <div>
            <Label>Dimensions</Label>
            <input className={inputClass} value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="40 × 50 cm" />
          </div>
          <div>
            <Label>Year</Label>
            <input type="number" className={inputClass} value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <textarea
            rows={4}
            className={`${inputClass} resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A few sentences about this piece…"
          />
        </div>

        <div>
          <Label>Subjects / tags</Label>
          <input
            className={inputClass}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="fruits, still life"
          />
          <p className="mt-1 text-xs text-gray-400">
            Comma-separated, e.g. <code>fruits, still life</code>. These power the
            subject filter on the shop &amp; portfolio grids — any new word you
            type becomes a new filter option automatically.
          </p>
        </div>

        <div>
          <Label>Search keywords (hidden)</Label>
          <input
            className={inputClass}
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="grapefruit, citrus, breakfast, summer"
          />
          <p className="mt-1 text-xs text-gray-400">
            Comma-separated. These don&apos;t show anywhere on the site — they
            only help people <em>find</em> this piece via the search box, by words
            that aren&apos;t in its title or a subject category.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div>
            <Label>Display order</Label>
            <input type="number" className={inputClass} value={order} onChange={(e) => setOrder(e.target.value)} placeholder="e.g. 12" />
            <p className="mt-1 text-xs text-gray-400">Lower numbers appear first in grids.</p>
          </div>
          <div>
            <label className="flex items-center gap-2 mt-5 sm:mt-7 text-sm text-gray-700">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4" />
              Feature on the homepage carousel
            </label>
            {featured && (
              <div className="mt-3">
                <Label>Position in carousel</Label>
                <input
                  type="number"
                  className={inputClass}
                  value={featuredOrder}
                  onChange={(e) => setFeaturedOrder(e.target.value)}
                  placeholder="e.g. 1"
                />
                <p className="mt-1 text-xs text-gray-400">Lower numbers appear first in the carousel.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Pricing (oil: original + prints + stickers; digital: prints + stickers) ── */}
      {category === "oil" && (
        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Original painting</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <Label>Price (€)</Label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 mt-5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={originalAvailable}
                onChange={(e) => setOriginalAvailable(e.target.checked)}
                className="w-4 h-4"
              />
              Available to buy (untick if sold)
            </label>
          </div>
        </section>
      )}

      {sellsPrints && (
        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Prints &amp; stickers</h2>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Print sizes</p>
            <div className="space-y-2">
              {prints.sizes.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={inputClass}
                    value={s.label}
                    onChange={(e) => setSizeLabel(setPrints, prints.sizes, i, e.target.value)}
                    placeholder="Size label"
                  />
                  <div className="relative w-32 shrink-0">
                    <span className="absolute left-3 top-2 text-sm text-gray-400">€</span>
                    <input
                      type="number"
                      step="0.01"
                      className={`${inputClass} pl-6`}
                      value={s.price}
                      onChange={(e) => setSizePrice(setPrints, prints.sizes, i, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Print finishes (comma-separated)</Label>
            <input
              className={inputClass}
              value={prints.finishes.join(", ")}
              onChange={(e) => setPrints((p) => ({ ...p, finishes: e.target.value.split(",").map((x) => x.trimStart()) }))}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Sticker</p>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={stickerSize.label}
                onChange={(e) => setStickerSize((s) => ({ ...s, label: e.target.value }))}
                placeholder="Size (e.g. 7 cm)"
              />
              <div className="relative w-32 shrink-0">
                <span className="absolute left-3 top-2 text-sm text-gray-400">€</span>
                <input
                  type="number"
                  step="0.01"
                  className={`${inputClass} pl-6`}
                  value={stickerSize.price}
                  onChange={(e) => setStickerSize((s) => ({ ...s, price: e.target.value }))}
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Stickers come in one size. The “with background” / “backgroundless” options are set
              automatically by which images you upload (<code>bg-…</code> / <code>no-bg-…</code>).
            </p>
          </div>
        </section>
      )}

      {/* ── Images (edit only) ───────────────────────────────────────────── */}
      {isEdit && (
        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Images</h2>
          {category === "sketch" ? (
            <ImageFolderManager
              folderPath={initial.originalFolder}
              label="Sketch images"
              hint="First image = card, second = hover (they sort by number, e.g. 1.jpg, 2.jpg)."
            />
          ) : (
            <>
              <ImageFolderManager
                folderPath={initial.originalFolder}
                label="Main / display images"
                hint="First image = card, second = hover (1.jpg, 2.jpg)."
              />
              <ImageFolderManager
                folderPath={initial.printsFolder}
                label="Print preview images"
                hint="Shown on the print product page. First image = card, second = hover."
              />
              <ImageFolderManager
                folderPath={initial.stickersFolder}
                label="Sticker images"
                hint='Name files "bg-…" (with background = card) and "no-bg-…" (backgroundless = hover).'
              />
            </>
          )}
        </section>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {saved && <p className="text-sm text-green-600" role="status">Saved ✓</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="admin-btn px-5 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create artwork"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/artworks")}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto rounded-lg border border-red-200 text-red-600 px-5 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>

      {!isEdit && (
        <p className="text-xs text-gray-400">
          After creating, you&apos;ll be taken to the edit page to upload images.
        </p>
      )}
    </form>
  );
}
