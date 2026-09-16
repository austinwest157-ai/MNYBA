"use client";

import { useState } from "react";

export default function ChangePasscodeForm() {
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPasscode !== confirmPasscode) {
      setError("New passcode and confirmation don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPasscode, newPasscode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Couldn't change the passcode.");
        return;
      }
      setSuccess(true);
      setCurrentPasscode("");
      setNewPasscode("");
      setConfirmPasscode("");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Current passcode</label>
        <input
          type="password"
          value={currentPasscode}
          onChange={(e) => setCurrentPasscode(e.target.value)}
          className={inputClass}
          autoComplete="current-password"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">New passcode</label>
        <input
          type="password"
          value={newPasscode}
          onChange={(e) => setNewPasscode(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Confirm new passcode</label>
        <input
          type="password"
          value={confirmPasscode}
          onChange={(e) => setConfirmPasscode(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">Passcode updated. Use it next time you log in.</p>}

      <button
        type="submit"
        disabled={submitting || !currentPasscode || !newPasscode}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Change passcode"}
      </button>
    </form>
  );
}
