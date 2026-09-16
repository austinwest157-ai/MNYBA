import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOverdue } from "@/lib/followup";
import { sendPush } from "@/lib/push";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const query = req.nextUrl.searchParams.get("secret");
  return query === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prospects = await prisma.prospect.findMany({ where: { archived: false } });
  const overdue = prospects.filter((p) => isOverdue(p));

  if (overdue.length === 0) {
    return NextResponse.json({ ok: true, overdueCount: 0, notified: 0 });
  }

  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) {
    return NextResponse.json({ ok: true, overdueCount: overdue.length, notified: 0, note: "No push subscriptions registered" });
  }

  const names = overdue.slice(0, 5).map((p) => p.name);
  const extra = overdue.length > names.length ? ` and ${overdue.length - names.length} more` : "";
  const payload = {
    title: overdue.length === 1 ? "1 prospect needs a follow-up" : `${overdue.length} prospects need a follow-up`,
    body: `${names.join(", ")}${extra} — no contact in 2+ weeks.`,
    url: "/dashboard",
  };

  let notified = 0;
  const staleEndpoints: string[] = [];

  for (const sub of subscriptions) {
    const result = await sendPush(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    );
    if (result.ok) notified++;
    if (result.gone) staleEndpoints.push(sub.endpoint);
  }

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: staleEndpoints } } });
  }

  return NextResponse.json({ ok: true, overdueCount: overdue.length, notified });
}
