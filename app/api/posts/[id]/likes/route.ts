import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

// POST /api/posts/[id]/likes - 좋아요 토글
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id: postId } = await params;
    const supabase = createServerClient();

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", auth.userId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase.from("likes").delete().eq("id", existingLike.id);
      return NextResponse.json({ success: true, data: { liked: false } });
    }

    // Like
    await supabase.from("likes").insert({
      post_id: postId,
      user_id: auth.userId,
    });

    return NextResponse.json({ success: true, data: { liked: true } });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
