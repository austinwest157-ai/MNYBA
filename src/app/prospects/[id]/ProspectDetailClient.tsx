"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Interaction, Prospect } from "@prisma/client";
import { formatDistanceToNow, format } from "date-fns";
import AppHeader from "@/components/AppHeader";
import StageBadge from "@/components/StageBadge";
import ProspectForm, { ProspectFormValues } from "@/components/ProspectForm";
import Modal from "@/components/Modal";
import { isOverdue } from "@/lib/followup";

type ProspectWithInteractions = Prospect & { interactions: Interaction[] };

export default function ProspectDetailClient({ prospect: initial }: { prospect: ProspectWithInteractions }) {
  const router = useRouter();
  const [prospect, setProspect] = useState(initial);
  const [showEdit, setShowEdit] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(
    prospect.nextFollowUpAt ? format(new Date(prospect.nextFollowUpAt), "yyyy-MM-dd") : ""
  );

  async function saveEdit(values: ProspectFormValues) {
    const res = await fetch(`/api/prospects/${prospect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        estimatedAmount: values.estimatedAmount ? Number(values.estimatedAmount) : null,
      }),
    });
    if (!res.ok) throw new Error("Failed to save");
    const { prospect: updated } = await res.json();
    setProspect((p) => ({ ...p, ...updated }));
    setShowEdit(false);
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error("Failed");
      const { interaction } = await res.json();
      setProspect((p) => ({
        ...p,
        lastContactedAt: new Date(interaction.occurredAt),
        nextFollowUpAt: null,
        interactions: [interaction, ...p.interactions],
      }));
      setFollowUpDate("");
      setNote("");
    } finally {
      setSavingNote(false);
    }
  }

  async function saveFollowUp() {
    const res = await fetch(`/api/prospects/${prospect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nextFollowUpAt: followUpDate ? new Date(followUpDate).toISOString() : null,
      }),
    });
    if (res.ok) {
      const { prospect: updated } = await res.json();
      setProspect((p) => ({ ...p, nextFollowUpAt: updated.nextFollowUpAt }));
    }
  }

  async function archive() {
    if (!confirm(`Archive ${prospect.name}? This removes them from the active pipeline.`)) return;
    await fetch(`/api/prospects/${prospect.id}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  const overdue = isOverdue(prospect);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <button onClick={() => router.push("/dashboard")} className="mb-4 text-sm text-slate-500 hover:text-slate-700">
          ← Back to dashboard
        </button>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{prospect.name}</h1>
              {prospect.organization && <p className="text-sm text-slate-500">{prospect.organization}</p>}
              <div className="mt-2 flex items-center gap-2">
                <StageBadge stage={prospect.stage} />
                {overdue && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                    Needs follow-up
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEdit(true)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                onClick={archive}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Archive
              </button>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
            <Field label="Phone" value={prospect.phone} />
            <Field label="Email" value={prospect.email} />
            <Field
              label="Estimated gift"
              value={prospect.estimatedAmount ? `$${prospect.estimatedAmount.toLocaleString()}` : null}
            />
            <Field
              label="Last contacted"
              value={
                prospect.lastContactedAt
                  ? formatDistanceToNow(new Date(prospect.lastContactedAt), { addSuffix: true })
                  : "Never"
              }
            />
          </dl>

          {prospect.notes && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-medium text-slate-500">Notes</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{prospect.notes}</p>
            </div>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-medium text-slate-500">Next follow-up date (optional override)</h3>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <button
                onClick={saveFollowUp}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Save
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Leave blank to use the default: flagged 14 days after the last logged contact.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Log a conversation</h2>
          <form onSubmit={addNote} className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you talk about?"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={savingNote || !note.trim()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {savingNote ? "Saving…" : "Add"}
            </button>
          </form>
          <p className="mt-1 text-xs text-slate-400">This also resets their &quot;last contacted&quot; date to today.</p>

          <ul className="mt-4 space-y-3">
            {prospect.interactions.length === 0 && (
              <li className="text-sm text-slate-400">No conversations logged yet.</li>
            )}
            {prospect.interactions.map((i) => (
              <li key={i.id} className="border-l-2 border-slate-200 pl-3">
                <p className="text-sm text-slate-700">{i.note}</p>
                <p className="text-xs text-slate-400">{format(new Date(i.occurredAt), "MMM d, yyyy")}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {showEdit && (
        <Modal title="Edit Prospect" onClose={() => setShowEdit(false)}>
          <ProspectForm
            initial={{
              name: prospect.name,
              organization: prospect.organization ?? "",
              phone: prospect.phone ?? "",
              email: prospect.email ?? "",
              stage: prospect.stage,
              estimatedAmount: prospect.estimatedAmount ? String(prospect.estimatedAmount) : "",
              notes: prospect.notes ?? "",
            }}
            submitLabel="Save changes"
            onSubmit={saveEdit}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value || "—"}</dd>
    </div>
  );
}
