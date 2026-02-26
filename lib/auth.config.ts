import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register") ||
        nextUrl.pathname.startsWith("/invite");
      const isPublicApi =
        nextUrl.pathname.startsWith("/api/register") ||
        nextUrl.pathname.startsWith("/api/invite-codes/verify") ||
        nextUrl.pathname.startsWith("/api/auth");

      if (isAuthPage || isPublicApi) {
        if (isAuthPage && isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
