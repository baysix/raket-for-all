import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.role === "platform_admin" ||
      session.user.role === "club_admin";

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    const { data: codes, error } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("club_id", session.user.clubId)
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.role === "platform_admin" ||
      session.user.role === "club_admin";

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const { role = "member", maxUses = 50 } = await request.json();
    const code = generateRandomCode();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("invite_codes")
      .insert({
        code,
        club_id: session.user.clubId,
        role,
        max_uses: maxUses,
        created_by: session.user.id,
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
