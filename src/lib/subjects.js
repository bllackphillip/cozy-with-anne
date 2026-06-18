/*
  SUBJECTS — the "what is it of" axis (flowers, fruits, …), separate from the
  `category` axis (oil / digital / sketch) that drives the routes.

  Stored on each artwork document as `tags: ["fruits", "still life"]` — an array
  of lowercase strings, so a piece can belong to more than one subject.

  Nothing here is hardcoded into the UI beyond a PREFERRED ORDER for the known
  subjects: the filter dropdown is built from the tags that actually appear in
  the data, so Anne can invent a new subject just by typing it on an artwork and
  it shows up automatically (sorted after the known ones; "other" always last).
*/

// Preferred display order for the established subjects. Unknown tags Anne adds
// later fall in after these (alphabetically); "other" is always pinned last.
export const SUBJECT_ORDER = [
  "fruits",
  "flowers",
  "still life",
  "nature",
];

// "still life" -> "still-life" (URL-safe). Generic, so any new tag just works.
export function slugifyTag(tag) {
  return String(tag)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// "still life" -> "Still Life" for display. Generic — no per-tag mapping needed.
export function subjectLabel(tag) {
  return String(tag).replace(/\b\w/g, (c) => c.toUpperCase());
}

function rank(tag) {
  const t = String(tag).toLowerCase();
  if (t === "other") return 9999; // always last
  const i = SUBJECT_ORDER.indexOf(t);
  return i === -1 ? 999 : i; // unknown subjects sit after the known set
}

// Distinct subjects present across a set of artworks, in preferred order.
export function collectSubjects(items) {
  const set = new Set();
  for (const item of items) {
    for (const tag of item.tags ?? []) {
      const v = String(tag).trim();
      if (v) set.add(v);
    }
  }
  return [...set].sort((a, b) => {
    const r = rank(a) - rank(b);
    return r !== 0 ? r : a.localeCompare(b);
  });
}

// Filter by selected subject (slug; "" = all) AND a free-text query.
//
// Each whitespace-separated word of the query is matched independently and in
// any order against a haystack of the title, medium, description, the dropdown
// `tags`, and a hidden `keywords` array. `keywords` lets a piece be
// found by terms that are neither in its title nor a subject category — e.g. a
// grapefruit painting can carry keywords ["grapefruit","citrus","breakfast"] so
// "grapefruit" finds it without a "grapefruit" filter ever existing.
export function filterArtworks(items, tagSlug, query) {
  const q = (query ?? "").trim().toLowerCase();
  return items.filter((item) => {
    const tags = item.tags ?? [];
    if (tagSlug && !tags.some((t) => slugifyTag(t) === tagSlug)) return false;
    if (q) {
      const haystack = [
        item.title,
        item.medium,
        item.description,
        ...tags,
        ...(item.keywords ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      // Match each word of the query independently, in any order, so "koi fish"
      // finds a piece carrying "koi" and "fish" as separate keywords (and
      // "fish koi" works too). Each token is a substring match.
      const tokens = q.split(/\s+/).filter(Boolean);
      if (!tokens.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });
}
