"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { listFolderImages, uploadImage, deleteImageAtPath } from "@/lib/storage";

/*
  IMAGE FOLDER MANAGER

  Manages the image files inside ONE Cloud Storage folder (e.g. an artwork's
  /original folder). Anne can see what's there, upload more, and delete.

  Files keep their own filenames, so naming stays in Anne's hands — which the
  storefront depends on:
    • non-sticker folders: the FIRST file (1.jpg) is the card image, the SECOND
      (2.jpg) is the hover image — they sort numerically.
    • sticker folders: a file starting "bg-" is the card, "no-bg-" is the hover.
  The `hint` prop spells this out per folder so she doesn't have to remember.

  Uploading a file whose name matches an existing one overwrites it — that's how
  you swap the card image without deleting first.
*/

export default function ImageFolderManager({ folderPath, label, hint }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const imgs = await listFolderImages(folderPath);
      setImages(imgs);
    } catch (err) {
      console.error(err);
      setError("Could not load images for this folder.");
    } finally {
      setLoading(false);
    }
  }, [folderPath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleUpload(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file later
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of files) {
        await uploadImage(folderPath, file);
      }
      await refresh();
    } catch (err) {
      console.error(err);
      setError("Upload failed. Check your connection and that you're signed in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(fullPath) {
    if (!window.confirm("Delete this image? This can't be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteImageAtPath(fullPath);
      await refresh();
    } catch (err) {
      console.error(err);
      setError("Could not delete that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
        </div>
        <label className="shrink-0 cursor-pointer admin-btn px-3 py-1.5 text-xs font-medium">
          {busy ? "Working…" : "Upload"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={busy}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-3 text-xs text-gray-400">Loading…</p>
      ) : images.length === 0 ? (
        <p className="mt-3 text-xs text-gray-400">No images yet.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <li key={img.fullPath} className="group relative">
              <div className="aspect-square relative overflow-hidden rounded-lg border border-gray-200 bg-white">
                <Image src={img.url} alt={img.name} fill sizes="120px" className="object-cover" />
              </div>
              <p className="mt-1 text-[11px] text-gray-500 truncate" title={img.name}>
                {i === 0 ? "★ " : ""}
                {img.name}
              </p>
              <button
                type="button"
                onClick={() => handleDelete(img.fullPath)}
                disabled={busy}
                title="Delete image"
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
