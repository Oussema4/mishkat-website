import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_RENEW_BELOW, sessionCookieOptions, signSession, verifySession } from "@/lib/session";

/**
 * Blocks every /admin page except the login page unless a valid session cookie is present, and
 * renews the session while the dashboard is in use (sliding 12 h, never past 7 days from sign-in).
 * This only checks the token; each page and action also checks the account in the database
 * (requireAdmin), so disabled accounts and old sessions are refused there.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  if (session.expiresAt - Math.floor(Date.now() / 1000) < SESSION_RENEW_BELOW) {
    const token = await signSession({ adminId: session.adminId, version: session.version, authTime: session.authTime });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
