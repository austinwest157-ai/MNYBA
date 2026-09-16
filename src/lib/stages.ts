import { Stage } from "@prisma/client";

export const STAGE_ORDER: Stage[] = [
  "NEW_LEAD",
  "FIRST_CONVERSATION",
  "FOLLOW_UP",
  "MEETING_SCHEDULED",
  "PROPOSAL_SENT",
  "VERBAL_COMMITMENT",
  "COMMITTED",
  "GIVING",
  "NOT_INTERESTED",
];

export const STAGE_LABELS: Record<Stage, string> = {
  NEW_LEAD: "New Lead",
  FIRST_CONVERSATION: "First Conversation",
  FOLLOW_UP: "Following Up",
  MEETING_SCHEDULED: "Meeting Scheduled",
  PROPOSAL_SENT: "Proposal Sent",
  VERBAL_COMMITMENT: "Verbal Commitment",
  COMMITTED: "Committed",
  GIVING: "Actively Giving",
  NOT_INTERESTED: "Not Interested",
};

export const STAGE_COLORS: Record<Stage, string> = {
  NEW_LEAD: "bg-slate-100 text-slate-700 border-slate-300",
  FIRST_CONVERSATION: "bg-sky-100 text-sky-700 border-sky-300",
  FOLLOW_UP: "bg-cyan-100 text-cyan-700 border-cyan-300",
  MEETING_SCHEDULED: "bg-indigo-100 text-indigo-700 border-indigo-300",
  PROPOSAL_SENT: "bg-violet-100 text-violet-700 border-violet-300",
  VERBAL_COMMITMENT: "bg-amber-100 text-amber-700 border-amber-300",
  COMMITTED: "bg-emerald-100 text-emerald-700 border-emerald-300",
  GIVING: "bg-green-100 text-green-800 border-green-300",
  NOT_INTERESTED: "bg-zinc-100 text-zinc-500 border-zinc-300",
};

// Stages where we stop nagging the user to follow up: the relationship is
// either closed-won (actively giving) or closed-lost.
export const TERMINAL_STAGES: Stage[] = ["GIVING", "NOT_INTERESTED"];

export const FOLLOW_UP_WINDOW_DAYS = 14;

export function stageIndex(stage: Stage): number {
  return STAGE_ORDER.indexOf(stage);
}
