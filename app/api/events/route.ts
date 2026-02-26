import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요."),
  description: z.string().optional(),
  event_date: z.string().min(1, "날짜를 선택해주세요."),
  start_time: z.string().min(1, "시작 시간을 입력해주세요."),
  end_time: z.string().min(1, "종료 시간을 입력해주세요."),
  location: z.string().optional(),
  court_info: z.string().optional(),
  game_type: z.string().optional(),
  max_participants: z.number().nullable().optional(),
  image_url: z.string().nullable().optional(),
});

// GET /api/events - 일정 목록 조회
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const upcoming = searchParams.get("upcoming") !== "false";

    const supabase = createServerClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("events")
      .select(
        `
        *,
        creator:users!events_created_by_fkey(id, name, nickname, profile_image),
        rsvps:event_rsvps(id, user_id, status, user:users(id, name, nickname, profile_image))
      `
      )
      .eq("club_id", session.user.clubId)
      .order("event_date", { ascending: upcoming })
      .order("start_time", { ascending: true })
      .range(offset, offset + limit - 1);

    if (upcoming) {
      query = query.gte("event_date", new Date().toISOString().split("T")[0]);
    }

    const { data: events, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: "일정을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // Add counts
    const eventsWithCounts = events?.map((event) => ({
      ...event,
      attending_count: event.rsvps?.filter(
        (r: { status: string }) => r.status === "attending"
      ).length || 0,
      waiting_count: event.rsvps?.filter(
        (r: { status: string }) => r.status === "waiting"
      ).length || 0,
    }));

    return NextResponse.json({ success: true, data: eventsWithCounts });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/events - 일정 생성
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
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        ...parsed.data,
        club_id: session.user.clubId,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "일정 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: event });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
