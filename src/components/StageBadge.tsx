import { Stage } from "@prisma/client";
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/stages";

export default function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
