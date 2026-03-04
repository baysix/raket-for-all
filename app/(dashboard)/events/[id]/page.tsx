"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  format,
  parseISO,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";
import { ko } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Gamepad2,
  Trash2,
  MoreHorizontal,
  Check,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-context";
import { toast } from "sonner";
import type { Event } from "@/types";

const gameTypeLabels: Record<string, string> = {
  rally: "랠리",
  singles: "단식",
  doubles: "복식",
  mixed_doubles: "혼복",
};

function getTimeRemaining(dateStr: string, timeStr: string) {
  const eventDate = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  const hours = differenceInHours(eventDate, now);
  const minutes = differenceInMinutes(eventDate, now) % 60;

  if (hours < 0) return null;
  if (hours === 0) return `${minutes}분 남음`;
  if (hours < 24) return `${hours}시간 ${minutes}분 남음`;
  return null;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      const result = await res.json();
      if (result.success) {
        setEvent(result.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleDelete = async () => {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const result = await res.json();

      if (result.success) {
        toast.success("일정이 삭제되었습니다.");
        router.push("/events");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleRsvp = async (status: "attending" | "waiting") => {
    if (!user) return;
    setRsvpLoading(status);

    try {
      const res = await fetch(`/api/events/${id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (result.data.status === null) {
        toast.success("참석 여부가 취소되었습니다.");
      } else if (status === "attending") {
        toast.success("참석으로 등록되었습니다!");
      } else {
        toast.success("대기로 등록되었습니다.");
      }

      fetchEvent();
    } catch {
      toast.error("처리에 실패했습니다.");
    } finally {
      setRsvpLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-4 text-center py-16">
        <p className="text-gray-400">일정을 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push("/events")}
          className="text-[#4CAF50] text-sm font-medium mt-2"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining(event.event_date, event.start_time);
  const isOwner = user?.id === event.created_by;
  const isAdmin =
    user?.role === "platform_admin" ||
    user?.role === "club_admin";
  const canManage = isOwner || isAdmin;

  const myRsvp = event.rsvps?.find((r) => r.user_id === user?.id);
  const attendingCount =
    event.rsvps?.filter((r) => r.status === "attending").length || 0;
  const isFull =
    event.max_participants !== null && attendingCount >= event.max_participants;

  const attending = event.rsvps?.filter((r) => r.status === "attending") || [];
  const waiting =
    event.rsvps?.filter((r) => r.status === "waiting") || [];

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-2 py-2">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">일정 상세</span>
          {canManage ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[120px]">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDelete();
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-red-500 font-medium flex items-center gap-2 active:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* Event image */}
      {event.image_url && (
        <div className="relative">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-52 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      {/* Title area */}
      <div className={`px-4 pb-4 text-center ${event.image_url ? "pt-4" : "pt-6"}`}>
        {event.game_type && (
          <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#E8F5E9] text-[#4CAF50] mb-3">
            {gameTypeLabels[event.game_type] || event.game_type}
          </span>
        )}
        <h1 className="text-xl font-bold mb-3">{event.title}</h1>

        {/* Creator info */}
        {event.creator && (
          <div className="flex items-center justify-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage
                src={event.creator.profile_image || undefined}
              />
              <AvatarFallback className="text-[10px] bg-gray-100 text-gray-500">
                {(
                  event.creator.nickname ||
                  event.creator.name ||
                  "?"
                ).charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-500">
              {event.creator.nickname || event.creator.name}
            </span>
          </div>
        )}
      </div>

      {/* Time remaining banner */}
      {timeRemaining && (
        <div className="mx-4 mb-4 bg-[#E8F5E9] rounded-xl p-3 text-center">
          <p className="text-sm text-[#388E3C]">
            일정까지{" "}
            <span className="font-bold text-[#4CAF50]">{timeRemaining}</span>
          </p>
        </div>
      )}

      {/* Description */}
      {event.description && (
        <div className="mx-4 mb-4">
          <h3 className="font-bold text-sm mb-2">상세 설명</h3>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {event.description}
            </p>
          </div>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="mx-4 mb-4">
        <h3 className="font-bold text-sm mb-2">기본 정보</h3>
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
          {/* 날짜 */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 bg-[#E8F5E9] rounded-lg flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-[#4CAF50]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">날짜</p>
              <p className="text-sm font-medium">
                {format(parseISO(event.event_date), "yyyy년 M월 d일 (EEE)", {
                  locale: ko,
                })}
              </p>
            </div>
          </div>

          {/* 시간 */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">시간</p>
              <p className="text-sm font-medium">
                {event.start_time.slice(0, 5)} ~ {event.end_time.slice(0, 5)}
              </p>
            </div>
          </div>

          {/* 장소 */}
          {event.location && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400">장소</p>
                <p className="text-sm font-medium">
                  {event.location}
                  {event.court_info && ` (${event.court_info})`}
                </p>
              </div>
            </div>
          )}

          {/* 게임 유형 */}
          {event.game_type && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                <Gamepad2 className="w-4 h-4 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400">게임 유형</p>
                <p className="text-sm font-medium">
                  {gameTypeLabels[event.game_type] || event.game_type}
                </p>
              </div>
            </div>
          )}

          {/* 인원 */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">참가 인원</p>
              <p className="text-sm font-medium">
                <span className="text-[#4CAF50] font-bold">
                  {attendingCount}
                </span>
                명 참석
                {event.max_participants && (
                  <span className="text-gray-400">
                    {" "}
                    / {event.max_participants}명
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 참가 현황 */}
      <div className="mx-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm">참가 현황</h3>
          <span className="text-xs text-gray-400">
            참석 {attendingCount}
            {event.max_participants ? `/${event.max_participants}명` : "명"}
            {waiting.length > 0 && ` · 대기 ${waiting.length}명`}
          </span>
        </div>
        <div className="bg-white border border-[#4CAF50] rounded-xl overflow-hidden">
          {/* 진행도 바 */}
          {event.max_participants && (
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">모집 현황</span>
                <span className={`text-xs font-bold ${isFull ? "text-red-500" : "text-[#4CAF50]"}`}>
                  {isFull ? "마감" : `${Math.round((attendingCount / event.max_participants) * 100)}%`}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isFull ? "bg-red-400" : "bg-[#4CAF50]"}`}
                  style={{ width: `${Math.min((attendingCount / event.max_participants) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* 참석자 목록 */}
          <div className={event.max_participants ? "border-t border-gray-50" : ""}>
            {attending.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">아직 참석자가 없습니다.</p>
                <p className="text-xs text-gray-300 mt-1">첫 번째로 참석해보세요!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {attending.map((rsvp, index) => (
                  <div key={rsvp.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs text-gray-300 w-5 text-right font-medium shrink-0">
                      {index + 1}
                    </span>
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={rsvp.user?.profile_image || undefined} />
                      <AvatarFallback className="text-xs bg-[#E8F5E9] text-[#4CAF50] font-semibold">
                        {(rsvp.user?.nickname || rsvp.user?.name || "?").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium flex-1">
                      {rsvp.user?.nickname || rsvp.user?.name}
                    </span>
                    {rsvp.user_id === user?.id && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#4CAF50] font-semibold shrink-0">
                        나
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 대기자 목록 */}
          {waiting.length > 0 && (
            <div className="border-t border-dashed border-amber-200">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/50">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-xs font-semibold text-amber-500">
                  대기 {waiting.length}명
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {waiting.map((rsvp, index) => (
                  <div key={rsvp.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs text-gray-300 w-5 text-right font-medium shrink-0">
                      {index + 1}
                    </span>
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={rsvp.user?.profile_image || undefined} />
                      <AvatarFallback className="text-xs bg-amber-50 text-amber-400 font-semibold">
                        {(rsvp.user?.nickname || rsvp.user?.name || "?").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1 text-gray-500">
                      {rsvp.user?.nickname || rsvp.user?.name}
                    </span>
                    {rsvp.user_id === user?.id && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 font-semibold shrink-0">
                        나
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom RSVP bar */}
      <div className="sticky bottom-0 z-40 bg-white border-t border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {/* Count info */}
          <div className="shrink-0">
            <p className="text-sm font-bold">
              <span className="text-[#4CAF50]">{attendingCount}</span>
              {event.max_participants ? `/${event.max_participants}` : ""}
              명
            </p>
            <p className="text-[10px] text-gray-400">참석 인원</p>
          </div>

          {/* RSVP buttons */}
          <div className="flex-1 flex gap-2">
            <button
              type="button"
              className={`flex-[2] h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors ${
                myRsvp?.status === "attending"
                  ? "bg-[#4CAF50] text-white active:bg-[#388E3C]"
                  : "border-2 border-[#4CAF50] text-[#4CAF50] active:bg-[#E8F5E9]"
              }`}
              onClick={() => handleRsvp("attending")}
              disabled={
                rsvpLoading !== null ||
                (isFull && myRsvp?.status !== "attending")
              }
            >
              {rsvpLoading === "attending" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {myRsvp?.status === "attending" ? "참석 중" : "참석하기"}
              {isFull && myRsvp?.status !== "attending" && " (마감)"}
            </button>

            <button
              type="button"
              className={`flex-1 h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors ${
                myRsvp?.status === "waiting"
                  ? "bg-amber-500 text-white active:bg-amber-600"
                  : "border border-amber-400 text-amber-500 active:bg-amber-50"
              }`}
              onClick={() => handleRsvp("waiting")}
              disabled={rsvpLoading !== null}
            >
              {rsvpLoading === "waiting" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              {myRsvp?.status === "waiting" ? "대기 중" : "대기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
