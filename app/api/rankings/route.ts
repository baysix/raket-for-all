import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/rankings
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const period = searchParams.get("period") || "month"; // "month" or "all"

    const supabase = createServerClient();

    // Get all attending rsvps for the club
    let rsvpQuery = supabase
      .from("event_rsvps")
      .select(
        `
        user_id,
        event:events!inner(club_id, event_date)
      `
      )
      .eq("status", "attending")
      .eq("event.club_id", session.user.clubId);

    if (period === "month") {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
      rsvpQuery = rsvpQuery
        .gte("event.event_date", firstDay)
        .lte("event.event_date", lastDay);
    }

    const { data: rsvps } = await rsvpQuery;

    // Count attendance per user
    const attendanceMap = new Map<string, number>();
    rsvps?.forEach((rsvp) => {
      const count = attendanceMap.get(rsvp.user_id) || 0;
      attendanceMap.set(rsvp.user_id, count + 1);
    });

    if (attendanceMap.size === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Get user info
    const userIds = Array.from(attendanceMap.keys());
    const { data: users } = await supabase
      .from("users")
      .select("id, name, nickname, profile_image")
      .in("id", userIds);

    // Build ranking
    const rankings = (users || [])
      .map((user) => ({
        user_id: user.id,
        name: user.name,
        nickname: user.nickname,
        profile_image: user.profile_image,
        attendance_count: attendanceMap.get(user.id) || 0,
        rank: 0,
      }))
      .sort((a, b) => b.attendance_count - a.attendance_count)
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return NextResponse.json({ success: true, data: rankings });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
