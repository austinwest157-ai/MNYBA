import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prospectInputSchema } from "@/lib/validation";
import { Stage } from "@prisma/client";

export async function GET(req: NextRequest) {
  const includeArchived = req.nextUrl.searchParams.get("archived") === "true";
  const prospects = await prisma.prospect.findMany({
    where: includeArchived ? {} : { archived: false },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ prospects });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = prospectInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const prospect = await prisma.prospect.create({
    data: {
      name: data.name,
      organization: data.organization || null,
      phone: data.phone || null,
      email: data.email || null,
      stage: (data.stage as Stage) || "NEW_LEAD",
      notes: data.notes || null,
      estimatedAmount: data.estimatedAmount ?? null,
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
    },
  });

  return NextResponse.json({ prospect }, { status: 201 });
}
