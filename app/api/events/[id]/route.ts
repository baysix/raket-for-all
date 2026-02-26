import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/events/[id] - 일정 상세 조회
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

    const { data: event, error } = await supabase
      .from("events")
      .select(
        `
        *,
        creator:users!events_created_by_fkey(id, name, nickname, profile_image),
        rsvps:event_rsvps(id, user_id, status, created_at, user:users(id, name, nickname, profile_image))
      `
      )
      .eq("id", id)
      .single();

    if (error || !event) {
      return NextResponse.json(
        { success: false, error: "일정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const attending_count =
      event.rsvps?.filter((r: { status: string }) => r.status === "attending")
        .length || 0;
    const waiting_count =
      event.rsvps?.filter(
        (r: { status: string }) => r.status === "waiting"
      ).length || 0;

    return NextResponse.json({
      success: true,
      data: { ...event, attending_count, waiting_count },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - 일정 삭제
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

    // Check ownership or admin
    const { data: event } = await supabase
      .from("events")
      .select("created_by")
      .eq("id", id)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: "일정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const isOwner = event.created_by === auth.userId;

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

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: "삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
