import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

function generateRandomCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET /api/invite-codes - 초대코드 목록
export async function GET() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Fetch user role and clubId from DB
    const { data: user } = await supabase
      .from("users")
      .select("role, club_id")
      .eq("id", auth.userId)
      .single();

    const isAdmin =
      user?.role === "platform_admin" ||
      user?.role === "club_admin";

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const { data: codes, error } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("club_id", user.club_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: "조회에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: codes });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/invite-codes - 초대코드 생성
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Fetch user role and clubId from DB
    const { data: user } = await supabase
      .from("users")
      .select("role, club_id")
      .eq("id", auth.userId)
      .single();

    const isAdmin =
      user?.role === "platform_admin" ||
      user?.role === "club_admin";

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const { role = "member", maxUses = 50 } = await request.json();
    const code = generateRandomCode();

    const { data, error } = await supabase
      .from("invite_codes")
      .insert({
        code,
        club_id: user.club_id,
        role,
        max_uses: maxUses,
        created_by: auth.userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
