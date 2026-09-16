"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Prospect, Stage } from "@prisma/client";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/stages";
import { isOverdue, daysSince } from "@/lib/followup";
import AppHeader from "@/components/AppHeader";
import Modal from "@/components/Modal";
import ProspectForm, { ProspectFormValues } from "@/components/ProspectForm";

const BOARD_STAGES = STAGE_ORDER.filter((s) => s !== "NOT_INTERESTED");

export default function DashboardClient({ initialProspects }: { initialProspects: Prospect[] }) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [showNew, setShowNew] = useState(false);
  const [showLost, setShowLost] = useState(false);

  const active = useMemo(() => prospects.filter((p) => p.stage !== "NOT_INTERESTED"), [prospects]);
  const lost = useMemo(() => prospects.filter((p) => p.stage === "NOT_INTERESTED"), [prospects]);
  const overdue = useMemo(() => active.filter((p) => isOverdue(p)), [active]);
  const giving = useMemo(() => prospects.filter((p) => p.stage === "GIVING"), [prospects]);

  const grouped = useMemo(() => {
    const map = new Map<Stage, Prospect[]>();
    for (const stage of BOARD_STAGES) map.set(stage, []);
    for (const p of active) map.get(p.stage)?.push(p);
    return map;
  }, [active]);

  async function createProspect(values: ProspectFormValues) {
    const res = await fetch("/api/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        estimatedAmount: values.estimatedAmount ? Number(values.estimatedAmount) : null,
      }),
    });
    if (!res.ok) throw new Error("Failed to create prospect");
    const { prospect } = await res.json();
    setProspects((prev) => [prospect, ...prev]);
    setShowNew(false);
  }

  async function quickChangeStage(id: string, stage: Stage) {
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)));
    await fetch(`/api/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Fundraising Pipeline</h1>
            <p className="text-sm text-slate-500">Track prospects from first conversation to committed giving.</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + New Prospect
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Active prospects" value={active.length} />
          <StatCard label="Need follow-up" value={overdue.length} tone={overdue.length > 0 ? "warn" : "default"} />
          <StatCard label="Verbal + committed" value={active.filter((p) => p.stage === "VERBAL_COMMITMENT" || p.stage === "COMMITTED").length} />
          <StatCard label="Actively giving" value={giving.length} tone="good" />
        </div>

        {overdue.length > 0 && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              {overdue.length} {overdue.length === 1 ? "prospect hasn't" : "prospects haven't"} been contacted in 2+ weeks:
            </p>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-amber-700">
              {overdue.map((p) => (
                <li key={p.id}>
                  <Link href={`/prospects/${p.id}`} className="underline hover:no-underline">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-4 overflow-x-auto pb-4">
          {BOARD_STAGES.map((stage) => (
            <div key={stage} className="w-64 flex-shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-slate-700">{STAGE_LABELS[stage]}</h2>
                <span className="text-xs text-slate-400">{grouped.get(stage)?.length ?? 0}</span>
              </div>
              <div className="space-y-2">
                {(grouped.get(stage) ?? []).map((p) => (
                  <ProspectCard key={p.id} prospect={p} onChangeStage={quickChangeStage} />
                ))}
                {(grouped.get(stage) ?? []).length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                    No prospects
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {lost.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowLost((v) => !v)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              {showLost ? "Hide" : "Show"} not interested ({lost.length})
            </button>
            {showLost && (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {lost.map((p) => (
                  <ProspectCard key={p.id} prospect={p} onChangeStage={quickChangeStage} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showNew && (
        <Modal title="New Prospect" onClose={() => setShowNew(false)}>
          <ProspectForm submitLabel="Add Prospect" onSubmit={createProspect} onCancel={() => setShowNew(false)} compact />
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "warn" | "good" }) {
  const toneClass =
    tone === "warn" ? "text-amber-600" : tone === "good" ? "text-emerald-600" : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function ProspectCard({
  prospect,
  onChangeStage,
}: {
  prospect: Prospect;
  onChangeStage: (id: string, stage: Stage) => void;
}) {
  const overdue = isOverdue(prospect);
  const days = daysSince(prospect.lastContactedAt);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <Link href={`/prospects/${prospect.id}`} className="block">
        <p className="text-sm font-medium text-slate-900">{prospect.name}</p>
        {prospect.organization && <p className="text-xs text-slate-500">{prospect.organization}</p>}
        <p className="mt-1 text-xs text-slate-400">
          {days === null ? "Never contacted" : `Last contact ${days}d ago`}
        </p>
      </Link>
      {overdue && (
        <p className="mt-1 inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">
          Needs follow-up
        </p>
      )}
      <select
        value={prospect.stage}
        onChange={(e) => onChangeStage(prospect.id, e.target.value as Stage)}
        className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-xs"
      >
        {[...STAGE_ORDER].map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
