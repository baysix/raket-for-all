import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createServerClient } from "./supabase/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-change-in-production"
);

const COOKIE_NAME = "racket-token";
const TOKEN_EXPIRY = "7d";

export interface JWTPayload {
  userId: string;
  email: string;
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthFromCookie(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<JWTPayload> {
  const auth = await getAuthFromCookie();
  if (!auth) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
    throw new Error("Unauthorized");
  }
  return auth;
}

/** 유저 정보 + role 한번에 조회 */
export async function requireAuthWithUser() {
  const auth = await requireAuth();
  const supabase = createServerClient();
  const { data } = await supabase
    .from("users")
    .select("id, email, name, nickname, role, club_id, profile_image")
    .eq("id", auth.userId)
    .single();

  return {
    userId: auth.userId,
    email: auth.email,
    role: data?.role ?? "member",
    clubId: data?.club_id ?? null,
    nickname: data?.nickname ?? data?.name ?? null,
    image: data?.profile_image ?? null,
  };
}

// Middleware용 (cookies() 사용 불가)
export function getTokenFromRequest(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
  return match ? match.split("=").slice(1).join("=").trim() : null;
}
