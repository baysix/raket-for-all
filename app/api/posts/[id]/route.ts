import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/posts/[id]
export async function GET(
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

    const { id } = await params;
    const supabase = createServerClient();

    const { data: post, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        author:users!posts_author_id_fkey(id, name, nickname, profile_image),
        comments:comments(id, content, created_at, author:users(id, name, nickname, profile_image)),
        likes:likes(count)
      `
      )
      .eq("id", id)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { success: false, error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check if user liked
    const { data: userLike } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", auth.userId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        likes_count: post.likes?.[0]?.count || 0,
        is_liked: !!userLike,
        likes: undefined,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id]
export async function DELETE(
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

    const { id } = await params;
    const supabase = createServerClient();

    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!post) {
      return NextResponse.json(
        { success: false, error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const isOwner = post.author_id === auth.userId;

    // Fetch user role from DB for admin check
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.userId)
      .single();

    const isAdmin =
      user?.role === "platform_admin" ||
      user?.role === "club_admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    await supabase.from("posts").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
