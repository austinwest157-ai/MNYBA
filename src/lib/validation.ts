import { z } from "zod";
import { STAGE_ORDER } from "./stages";

export const stageEnum = z.enum(STAGE_ORDER as [string, ...string[]]);

export const prospectInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  stage: stageEnum.optional(),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
  estimatedAmount: z.coerce.number().nonnegative().optional().nullable(),
  nextFollowUpAt: z.string().datetime().optional().nullable().or(z.literal("")),
});

export const interactionInputSchema = z.object({
  note: z.string().trim().min(1, "Note is required").max(5000),
  occurredAt: z.string().datetime().optional(),
});

export type ProspectInput = z.infer<typeof prospectInputSchema>;
