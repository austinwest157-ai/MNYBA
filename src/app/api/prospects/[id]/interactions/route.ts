import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { interactionInputSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = interactionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const prospect = await prisma.prospect.findUnique({ where: { id } });
  if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();

  const [interaction] = await prisma.$transaction([
    prisma.interaction.create({
      data: { prospectId: id, note: data.note, occurredAt },
    }),
    prisma.prospect.update({
      where: { id },
      data: {
        lastContactedAt:
          !prospect.lastContactedAt || occurredAt > prospect.lastContactedAt
            ? occurredAt
            : prospect.lastContactedAt,
        // Logging a new contact clears a stale manual follow-up date so the
        // default 14-day window takes back over, unless the caller re-sets one.
        nextFollowUpAt: null,
      },
    }),
  ]);

  return NextResponse.json({ interaction }, { status: 201 });
}
