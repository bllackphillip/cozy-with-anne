"use client";
import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a06868]/40";

export default function CommissionForm() {
  const [form, setForm] = useState({ name: "", email: "", vision: "" });
  const [file, setFile] = useState(null); // optional reference image
  const [company, setCompany] = useState(""); // honeypot — stays empty for humans
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB — must match the API route

  function update(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (file && file.size > MAX_FILE_BYTES) {
      setError("That reference image is too large (max 8 MB). Please choose a smaller file.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // FormData (not JSON) so the optional reference image is uploaded too.
      // No Content-Type header — the browser sets the multipart boundary.
      const body = new FormData();
      body.append("name", form.name);
      body.append("email", form.email);
      body.append("vision", form.vision);
      body.append("company", company);
      if (file) body.append("attachment", file);

      const res = await fetch("/api/enquiry", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSubmitted(true);
    } catch (err) {
      setError(
        err.message && err.message !== "Request failed"
          ? err.message
          : "Something went wrong sending your enquiry. Please try again, or email support@cozywithanne.com."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <h3
          className="text-3xl text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Thank you, {form.name}!
        </h3>
        <p className="mt-4 text-gray-600 max-w-md mx-auto leading-relaxed">
          I have received your enquiry and I&apos;ll be in touch in the next 24
          hours. I&apos;m so excited to hear more about what you have in mind.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Honeypot: hidden from real users; a filled value flags a bot. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="commission-company">Company</label>
        <input
          id="commission-company"
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your name <span className="text-[var(--color-accent)]">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={update}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your email <span className="text-[var(--color-accent)]">*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={update}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What do you have in mind? <span className="text-[var(--color-accent)]">*</span>
        </label>
        <textarea
          name="vision"
          required
          rows={5}
          value={form.vision}
          onChange={update}
          placeholder="Describe the subject, mood, size, budget range, attach any references if you have..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reference image{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="file"
          name="attachment"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[var(--color-surface-2)] file:text-[var(--color-accent)] hover:file:bg-[#ede0db] file:cursor-pointer"
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
        className="px-10 py-3 text-sm font-medium site-btn-active disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
