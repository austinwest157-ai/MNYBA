"use client";

import { useState } from "react";
import { Stage } from "@prisma/client";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/stages";

export type ProspectFormValues = {
  name: string;
  organization: string;
  phone: string;
  email: string;
  stage: Stage;
  estimatedAmount: string;
  notes: string;
};

const EMPTY: ProspectFormValues = {
  name: "",
  organization: "",
  phone: "",
  email: "",
  stage: "NEW_LEAD",
  estimatedAmount: "",
  notes: "",
};

export default function ProspectForm({
  initial,
  submitLabel = "Save",
  onSubmit,
  onCancel,
  compact = false,
}: {
  initial?: Partial<ProspectFormValues>;
  submitLabel?: string;
  onSubmit: (values: ProspectFormValues) => Promise<void>;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const [values, setValues] = useState<ProspectFormValues>({ ...EMPTY, ...initial });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProspectFormValues>(key: K, value: ProspectFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Name is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch {
      setError("Something went wrong saving this prospect.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={compact ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "grid grid-cols-1 gap-4"}>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Name *</label>
          <input
            autoFocus
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Organization</label>
          <input
            value={values.organization}
            onChange={(e) => set("organization", e.target.value)}
            className={inputClass}
            placeholder="First Baptist Church"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
          <input
            type="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={inputClass}
            placeholder="(555) 555-5555"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
          <input
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputClass}
            placeholder="jane@example.org"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Stage</label>
          <select
            value={values.stage}
            onChange={(e) => set("stage", e.target.value as Stage)}
            className={inputClass}
          >
            {STAGE_ORDER.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Estimated gift ($)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={values.estimatedAmount}
            onChange={(e) => set("estimatedAmount", e.target.value)}
            className={inputClass}
            placeholder="5000"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={compact ? 2 : 4}
          className={inputClass}
          placeholder="Context from the first conversation, interests, connections..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
