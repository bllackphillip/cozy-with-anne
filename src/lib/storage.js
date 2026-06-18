import {
  ref,
  listAll,
  getDownloadURL,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";

export async function getImagesFromFolder(folderPath) {
  if (!folderPath) return [];
  const folderRef = ref(storage, folderPath);
  const result = await listAll(folderRef);
  const sorted = result.items.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );
  return Promise.all(
    sorted.map(async (item) => ({
      url: await getDownloadURL(item),
      name: item.name,
    }))
  );
}

export async function getFirstImageUrl(folderPath) {
  if (!folderPath) return null;
  try {
    const imgs = await getImagesFromFolder(folderPath);
    return imgs[0]?.url ?? null;
  } catch {
    return null;
  }
}

/* ───────────────────────────────────────────────────────────────────────────
   ADMIN STORAGE WRITES

   Used by the back-office image manager. Like the Firestore writes, these only
   succeed for Anne's authenticated session because the Storage security rules
   gate writes on her UID.
   ──────────────────────────────────────────────────────────────────────────*/

// Like getImagesFromFolder but also returns each item's fullPath, which the
// admin UI needs in order to delete a specific file.
export async function listFolderImages(folderPath) {
  if (!folderPath) return [];
  const result = await listAll(ref(storage, folderPath));
  const sorted = result.items.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );
  return Promise.all(
    sorted.map(async (item) => ({
      name: item.name,
      fullPath: item.fullPath,
      url: await getDownloadURL(item),
    }))
  );
}

// Upload one file into a folder, keeping its (sanitised) filename so Anne
// controls naming. Uploading a file with an existing name overwrites it
// (e.g. re-upload "1.jpg" to swap the card image). Returns the new URL.
export async function uploadImage(folderPath, file, filenameOverride) {
  const safeName = (filenameOverride ?? file.name).replace(/[^a-zA-Z0-9.\-_]/g, "-");
  const objectRef = ref(storage, `${folderPath}/${safeName}`);
  await uploadBytes(objectRef, file);
  return { name: safeName, fullPath: objectRef.fullPath, url: await getDownloadURL(objectRef) };
}

// Delete a single file by its full Storage path.
export async function deleteImageAtPath(fullPath) {
  await deleteObject(ref(storage, fullPath));
}
