import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const profileSchema = z.object({
  nickname: z.string().min(1, "닉네임을 입력해주세요.").optional(),
  phone: z.string().optional().nullable(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  tennis_start_date: z.string().optional().nullable(),
  ntrp_level: z.string().optional().nullable(),
  bio: z.string().max(200, "자기소개는 200자 이내로 입력해주세요.").optional().nullable(),
  profile_image: z.string().optional().nullable(),
});

// GET /api/profile - 내 프로필 + 통계 조회
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

    // 유저 정보
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", auth.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: "프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // password_hash 제거
    const { password_hash: _, ...safeUser } = user;

    // 참여 횟수 (attending 상태인 RSVP)
    const { count: attendanceCount } = await supabase
      .from("event_rsvps")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.userId)
      .eq("status", "attending");

    // 게시글 수
    const { count: postCount } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", auth.userId);

    // 댓글 수
    const { count: commentCount } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", auth.userId);

    return NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        stats: {
          attendance_count: attendanceCount || 0,
          post_count: postCount || 0,
          comment_count: commentCount || 0,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT /api/profile - 프로필 수정
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: user, error } = await supabase
      .from("users")
      .update(parsed.data)
      .eq("id", auth.userId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "프로필 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    const { password_hash: __, ...safeUpdatedUser } = user;
    return NextResponse.json({ success: true, data: safeUpdatedUser });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
