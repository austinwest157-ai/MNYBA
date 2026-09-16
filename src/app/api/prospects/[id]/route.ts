import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prospectInputSchema } from "@/lib/validation";
import { Stage } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: { interactions: { orderBy: { occurredAt: "desc" } } },
  });
  if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ prospect });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = prospectInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.prospect.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prospect = await prisma.prospect.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.organization !== undefined && { organization: data.organization || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.stage !== undefined && { stage: data.stage as Stage }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.estimatedAmount !== undefined && { estimatedAmount: data.estimatedAmount }),
      ...(data.nextFollowUpAt !== undefined && {
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
      }),
    },
  });

  return NextResponse.json({ prospect });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.prospect.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.prospect.update({ where: { id }, data: { archived: true } });
  return NextResponse.json({ ok: true });
}
