import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isLoginRequired, isValidSessionToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/_next") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // No passcode has been set from Settings yet, so the app is open to
  // anyone with the link. There's nothing to check a session cookie against.
  if (!(await isLoginRequired())) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = await isValidSessionToken(token);

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
