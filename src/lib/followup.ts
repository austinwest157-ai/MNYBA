import { Prospect } from "@prisma/client";
import { FOLLOW_UP_WINDOW_DAYS, TERMINAL_STAGES } from "./stages";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A prospect is "due" once we've gone past their explicit next-follow-up
 * date, or (absent one) past the default 14-day-since-last-contact window
 * measured from last contact, or from creation if never contacted.
 */
export function followUpDueAt(prospect: Pick<Prospect, "stage" | "lastContactedAt" | "nextFollowUpAt" | "createdAt" | "archived">): Date | null {
  if (prospect.archived || TERMINAL_STAGES.includes(prospect.stage)) return null;
  if (prospect.nextFollowUpAt) return prospect.nextFollowUpAt;
  const base = prospect.lastContactedAt ?? prospect.createdAt;
  return new Date(base.getTime() + FOLLOW_UP_WINDOW_DAYS * DAY_MS);
}

export function isOverdue(prospect: Pick<Prospect, "stage" | "lastContactedAt" | "nextFollowUpAt" | "createdAt" | "archived">, now: Date = new Date()): boolean {
  const due = followUpDueAt(prospect);
  return due !== null && due.getTime() <= now.getTime();
}

export function daysSince(date: Date | null, now: Date = new Date()): number | null {
  if (!date) return null;
  return Math.floor((now.getTime() - date.getTime()) / DAY_MS);
}
