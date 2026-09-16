import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const prospects = await prisma.prospect.findMany({
    where: { archived: false },
    orderBy: { updatedAt: "desc" },
  });

  return <DashboardClient initialProspects={prospects} />;
}
