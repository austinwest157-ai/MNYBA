import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  clearPasscode,
  createSessionToken,
  isLoginRequired,
  setPasscode,
  verifyPasscode,
} from "@/lib/auth";

const postSchema = z.object({
  currentPasscode: z.string().optional(),
  newPasscode: z.string().min(4, "Passcode must be at least 4 characters").max(200),
});

const deleteSchema = z.object({
  currentPasscode: z.string().min(1),
});

export async function GET() {
  return NextResponse.json({ enabled: await isLoginRequired() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { currentPasscode, newPasscode } = parsed.data;

  if (await isLoginRequired()) {
    if (!currentPasscode || !(await verifyPasscode(currentPasscode))) {
      return NextResponse.json({ error: "Current passcode is incorrect" }, { status: 401 });
    }
  }

  await setPasscode(newPasscode);

  // Set a fresh session so whoever just did this isn't immediately logged
  // out by the login requirement they just turned on/changed.
  const { token, expires } = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!(await verifyPasscode(parsed.data.currentPasscode))) {
    return NextResponse.json({ error: "Current passcode is incorrect" }, { status: 401 });
  }

  await clearPasscode();
  return NextResponse.json({ ok: true });
}
