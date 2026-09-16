import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionToken, verifyPasscode } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  if (!passcode) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  let valid: boolean;
  try {
    valid = await verifyPasscode(passcode);
  } catch {
    return NextResponse.json(
      { error: "The app isn't configured yet: APP_PASSCODE is missing." },
      { status: 500 }
    );
  }

  if (!valid) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

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
