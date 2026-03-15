import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware that checks for the session cookie.
// The actual auth validation happens in the API routes via auth().
// This provides a fast redirect for unauthenticated users on protected pages.
export function middleware(req: NextRequest) {
  // Auth.js v5 uses this cookie name for JWT sessions
  const sessionCookie =
    req.cookies.get("authjs.session-token") ||
    req.cookies.get("__Secure-authjs.session-token");

  const isLoggedIn = !!sessionCookie;

  const isOnDashboard =
    req.nextUrl.pathname.startsWith("/concepts") ||
    req.nextUrl.pathname.startsWith("/graph") ||
    req.nextUrl.pathname.startsWith("/explore") ||
    req.nextUrl.pathname.startsWith("/import");

  const isOnAuth =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isOnAuth && isLoggedIn) {
    return NextResponse.redirect(new URL("/concepts", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
