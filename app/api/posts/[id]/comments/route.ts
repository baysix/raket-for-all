import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// POST /api/posts/[id]/comments
export async function POST(
  request: NextRequest,
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
    const body = await request.json();

    const parsed = z
      .object({ content: z.string().min(1, "내용을 입력해주세요.") })
      .safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        author_id: auth.userId,
        content: parsed.data.content,
      })
      .select("*, author:users(id, name, nickname, profile_image)")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "댓글 작성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: comment });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
