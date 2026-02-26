import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/invite");

  const isPublicApi =
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/invite-codes/verify") ||
    pathname.startsWith("/api/auth");

  if (isAuthPage || isPublicApi) {
    return NextResponse.next();
  }

  // NextAuth v5 세션 쿠키 확인
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|login|register|invite).*)",
  ],
};
