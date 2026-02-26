import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

// POST /api/events/[id]/rsvp - 참석/대기 토글
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

    const { id: eventId } = await params;
    const { status } = await request.json();

    if (!["attending", "waiting"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 상태입니다." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if event exists and if max_participants is reached
    const { data: event } = await supabase
      .from("events")
      .select("id, max_participants")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: "일정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check existing rsvp
    const { data: existingRsvp } = await supabase
      .from("event_rsvps")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", auth.userId)
      .single();

    // If same status, remove the rsvp (toggle off)
    if (existingRsvp && existingRsvp.status === status) {
      await supabase.from("event_rsvps").delete().eq("id", existingRsvp.id);

      return NextResponse.json({ success: true, data: { status: null } });
    }

    // Check max participants when attending
    if (status === "attending" && event.max_participants) {
      const { count } = await supabase
        .from("event_rsvps")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "attending");

      const currentAttending = count || 0;
      const alreadyAttending = existingRsvp?.status === "attending";

      if (!alreadyAttending && currentAttending >= event.max_participants) {
        return NextResponse.json(
          { success: false, error: "참석 인원이 가득 찼습니다." },
          { status: 400 }
        );
      }
    }

    // Upsert rsvp
    const { data: rsvp, error } = await supabase
      .from("event_rsvps")
      .upsert(
        {
          event_id: eventId,
          user_id: auth.userId,
          status,
        },
        { onConflict: "event_id,user_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: "처리에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: rsvp });
  } catch {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
