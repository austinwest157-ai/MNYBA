"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

export default function PasscodeSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetFields() {
    setCurrentPasscode("");
    setNewPasscode("");
    setConfirmPasscode("");
  }

  async function handleSetOrChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPasscode !== confirmPasscode) {
      setError("New passcode and confirmation don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPasscode: currentPasscode || undefined, newPasscode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Couldn't save the passcode.");
        return;
      }
      setEnabled(true);
      setSuccess(enabled ? "Passcode changed." : "Login enabled. Anyone opening the link now needs this passcode.");
      resetFields();
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!confirm("Turn off login? Anyone with the link will be able to open the app without a passcode.")) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/passcode", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPasscode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Couldn't disable login.");
        return;
      }
      setEnabled(false);
      setSuccess("Login is off. Anyone with the link can open the app.");
      resetFields();
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Login</h3>

      {!enabled && (
        <>
          <p className="mt-1 text-sm text-slate-500">
            No passcode is set — anyone with the link can open this app right now. Set a
            passcode to require login.
          </p>
          <form onSubmit={handleSetOrChange} className="mt-3 space-y-3">
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
              <label className="mb-1 block text-xs font-medium text-slate-600">Confirm passcode</label>
              <input
                type="password"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}
            <button
              type="submit"
              disabled={submitting || !newPasscode}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Enable login"}
            </button>
          </form>
        </>
      )}

      {enabled && (
        <>
          <p className="mt-1 text-sm text-slate-500">
            A passcode is required to open this app.
          </p>
          <form onSubmit={handleSetOrChange} className="mt-3 space-y-3">
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
            {success && <p className="text-sm text-emerald-600">{success}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={submitting || !currentPasscode || !newPasscode}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Change passcode"}
              </button>
              <button
                type="button"
                onClick={handleDisable}
                disabled={submitting || !currentPasscode}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Turn off login
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Enter your current passcode above before changing or turning off login.
            </p>
          </form>
        </>
      )}
    </div>
  );
}
