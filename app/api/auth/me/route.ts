import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) {
    return NextResponse.json({ user: null });
  }

  const supabase = createServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, email, name, nickname, role, club_id, profile_image")
    .eq("id", auth.userId)
    .single();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      role: user.role,
      clubId: user.club_id,
      image: user.profile_image,
    },
  });
}
