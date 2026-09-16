import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProspectDetailClient from "./ProspectDetailClient";

export const dynamic = "force-dynamic";

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: { interactions: { orderBy: { occurredAt: "desc" } } },
  });

  if (!prospect) notFound();

  return <ProspectDetailClient prospect={prospect} />;
}
