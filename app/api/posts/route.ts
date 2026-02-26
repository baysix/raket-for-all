import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const postSchema = z.object({
  type: z.enum(["announcement", "review", "community"]),
  title: z.string().min(1, "제목을 입력해주세요."),
  content: z.string().min(1, "내용을 입력해주세요."),
  image_urls: z.array(z.string()).optional(),
});

// GET /api/posts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const supabase = createServerClient();

    let query = supabase
      .from("posts")
      .select(
        `
        *,
        author:users!posts_author_id_fkey(id, name, nickname, profile_image),
        comments:comments(count),
        likes:likes(count)
      `
      )
      .eq("club_id", session.user.clubId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("type", type);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: "게시글을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // Check if current user liked each post
    const postIds = posts?.map((p) => p.id) || [];
    const { data: userLikes } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", session.user.id)
      .in("post_id", postIds);

    const likedPostIds = new Set(userLikes?.map((l) => l.post_id) || []);

    const formattedPosts = posts?.map((post) => ({
      ...post,
      comments_count: post.comments?.[0]?.count || 0,
      likes_count: post.likes?.[0]?.count || 0,
      is_liked: likedPostIds.has(post.id),
      comments: undefined,
      likes: undefined,
    }));

    return NextResponse.json({ success: true, data: formattedPosts });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/posts
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Only admins can post announcements
    if (
      parsed.data.type === "announcement" &&
      session.user.role !== "platform_admin" &&
      session.user.role !== "club_admin"
    ) {
      return NextResponse.json(
        { success: false, error: "공지사항은 운영자만 작성할 수 있습니다." },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        ...parsed.data,
        club_id: session.user.clubId,
        author_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "게시글 작성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: post });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
