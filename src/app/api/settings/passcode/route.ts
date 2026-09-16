import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyPasscode, setPasscode } from "@/lib/auth";

const schema = z.object({
  currentPasscode: z.string().min(1),
  newPasscode: z.string().min(4, "New passcode must be at least 4 characters").max(200),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { currentPasscode, newPasscode } = parsed.data;

  let currentValid: boolean;
  try {
    currentValid = await verifyPasscode(currentPasscode);
  } catch {
    return NextResponse.json(
      { error: "The app isn't configured yet: APP_PASSCODE is missing." },
      { status: 500 }
    );
  }

  if (!currentValid) {
    return NextResponse.json({ error: "Current passcode is incorrect" }, { status: 401 });
  }

  await setPasscode(newPasscode);
  return NextResponse.json({ ok: true });
}
