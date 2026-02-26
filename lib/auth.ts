import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Kakao from "next-auth/providers/kakao";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { createServerClient } from "./supabase/server";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID,
      clientSecret: process.env.AUTH_KAKAO_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const supabase = createServerClient();

        const { data: user } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (!user || !user.password_hash) return null;

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.profile_image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const supabase = createServerClient();
        const { data: dbUser } = await supabase
          .from("users")
          .select("id, role, club_id, nickname")
          .eq("email", user.email!)
          .single();

        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.clubId = dbUser.club_id;
          token.nickname = dbUser.nickname;
        }
      }

      if (trigger === "update" && session) {
        if (session.nickname !== undefined) token.nickname = session.nickname;
        if (session.role !== undefined) token.role = session.role;
        if (session.image !== undefined) token.picture = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.clubId = token.clubId as string;
        session.user.nickname = token.nickname as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "kakao") {
        const supabase = createServerClient();
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("email", user.email!)
          .single();

        if (!existingUser) {
          // Kakao user doesn't exist yet - they need to register with invite code first
          return `/register?email=${encodeURIComponent(user.email!)}&name=${encodeURIComponent(user.name || "")}&image=${encodeURIComponent(user.image || "")}`;
        }
      }
      return true;
    },
  },
  session: {
    strategy: "jwt",
  },
});
