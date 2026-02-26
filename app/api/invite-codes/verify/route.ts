import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "초대코드를 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: inviteCode, error } = await supabase
      .from("invite_codes")
      .select("*, club:clubs(*)")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (error || !inviteCode) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 초대코드입니다." },
        { status: 404 }
      );
    }

    // Check expiration
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "만료된 초대코드입니다." },
        { status: 400 }
      );
    }

    // Check usage limit
    if (inviteCode.used_count >= inviteCode.max_uses) {
      return NextResponse.json(
        { success: false, error: "사용 횟수가 초과된 초대코드입니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        codeId: inviteCode.id,
        clubId: inviteCode.club_id,
        clubName: inviteCode.club?.name,
        role: inviteCode.role,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
