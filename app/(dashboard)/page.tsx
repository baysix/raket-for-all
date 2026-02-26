"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import Link from "next/link";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  CalendarDays,
  MapPin,
  Users,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event, RankingEntry } from "@/types";

function getDateLabel(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return "오늘";
  if (isTomorrow(date)) return "내일";
  return format(date, "M/d(EEE)", { locale: ko });
}

function getDateBadgeStyle(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return "bg-[#4CAF50] text-white";
  if (isTomorrow(date)) return "bg-[#E8F5E9] text-[#4CAF50]";
  return "bg-gray-100 text-gray-600";
}

const gameTypeLabels: Record<string, string> = {
  rally: "랠리",
  singles: "단식",
  doubles: "복식",
  mixed_doubles: "혼복",
};

function getCareerText(startDate: string | null | undefined) {
  if (!startDate) return "-";
  const start = parseISO(startDate);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (totalMonths < 0) return "-";
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0 && months === 0) return "1개월 미만";
  if (years === 0) return `${months}개월차`;
  if (months === 0) return `${years}년차`;
  return `${years}년 ${months}개월차`;
}

export default function HomePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myAttendanceCount, setMyAttendanceCount] = useState<number>(0);
  const [tennisStartDate, setTennisStartDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, rankingsRes, profileRes] = await Promise.all([
          fetch("/api/events?limit=20&upcoming=true"),
          fetch("/api/rankings?limit=100"),
          fetch("/api/profile"),
        ]);

        const [eventsData, rankingsData, profileData] = await Promise.all([
          eventsRes.json(),
          rankingsRes.json(),
          profileRes.json(),
        ]);

        if (eventsData.success) setEvents(eventsData.data);
        if (rankingsData.success && user?.id) {
          const myRanking = rankingsData.data.find(
            (r: RankingEntry) => r.user_id === user?.id
          );
          if (myRanking) {
            setMyAttendanceCount(myRanking.attendance_count);
          }
        }
        if (profileData.success) {
          setTennisStartDate(profileData.data.tennis_start_date || null);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);


  // 다가오는 일정: 내가 참석 누른 일정만
  const myUpcomingEvents = events.filter((e) =>
    e.rsvps?.some(
      (r) => r.user_id === user?.id && r.status === "attending"
    )
  );

  // 등록된 일정: 전체 일정 리스트
  const allEvents = events;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Profile stats card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback className="text-base bg-[#E8F5E9] text-[#4CAF50] font-bold">
              {(user?.nickname || user?.name || "U").charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate">
              {user?.nickname || user?.name || "회원"}
            </p>
            <p className="text-xs text-gray-400">
              {user?.email}
            </p>
          </div>
          <Link
            href="/mypage"
            className="text-xs text-gray-400 flex items-center gap-0.5 active:text-gray-600 shrink-0"
          >
            내 정보
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-center">
            <p className="text-[11px] text-gray-400 mb-0.5">경력</p>
            <p className="text-sm font-bold text-gray-800">
              {getCareerText(tennisStartDate)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-center">
            <p className="text-[11px] text-gray-400 mb-0.5">참여한 일정</p>
            <p className="text-sm font-bold text-gray-800">
              {myAttendanceCount}
              <span className="text-xs font-normal text-gray-400 ml-0.5">회</span>
            </p>
          </div>
        </div>
      </div>

      {/* Club banner */}
      <div className="relative bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] rounded-2xl p-5 overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-30">
          🎾
        </div>
        <p className="text-white/80 text-xs font-medium mb-1">라켓포올</p>
        <p className="text-white text-lg font-bold leading-tight">
          함께하는 테니스,<br />
          더 즐거운 코트!
        </p>
        <p className="text-white/70 text-xs mt-2">
          동호회 일정을 확인하고 참여해보세요
        </p>
      </div>

      {/* Upcoming events (highlighted) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">다가오는 일정</h2>
          <Link
            href="/schedule?tab=list"
            className="text-xs font-medium text-[#4CAF50] flex items-center gap-0.5 active:text-[#388E3C]"
          >
            전체보기
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {myUpcomingEvents.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">참석 예정인 일정이 없습니다</p>
            <Link
              href="/events"
              className="inline-block mt-3 text-sm font-medium text-[#4CAF50] active:text-[#388E3C]"
            >
              일정 확인하기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myUpcomingEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block">
                <div className="bg-white border border-gray-100 rounded-xl p-4 active:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Date badge */}
                    <div className={`px-2.5 py-1.5 rounded-lg text-center shrink-0 ${getDateBadgeStyle(event.event_date)}`}>
                      <p className="text-[10px] font-medium leading-none">
                        {getDateLabel(event.event_date)}
                      </p>
                      <p className="text-sm font-bold mt-1 leading-none">
                        {event.start_time.slice(0, 5)}
                      </p>
                    </div>

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {event.game_type && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-gray-200 text-gray-500">
                            {gameTypeLabels[event.game_type] || event.game_type}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm truncate">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        {event.location && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{event.location}</span>
                          </span>
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.start_time.slice(0, 5)} ~ {event.end_time.slice(0, 5)}
                        </span>
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-9 h-9 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-[#4CAF50]" />
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {event.attending_count || 0}
                        {event.max_participants ? `/${event.max_participants}` : ""}명
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 등록된 일정 (전체) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">등록된 일정</h2>
          <Link
            href="/events"
            className="text-xs font-medium text-[#4CAF50] flex items-center gap-0.5 active:text-[#388E3C]"
          >
            전체보기
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {allEvents.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">등록된 일정이 없습니다</p>
            <Link
              href="/events/new"
              className="inline-block mt-3 text-sm font-medium text-[#4CAF50] active:text-[#388E3C]"
            >
              일정 등록하기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {allEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block">
                <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 active:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Date badge */}
                    <div className={`w-11 shrink-0 rounded-lg py-1.5 text-center ${getDateBadgeStyle(event.event_date)}`}>
                      <p className="text-[10px] font-semibold leading-none">
                        {getDateLabel(event.event_date)}
                      </p>
                      <p className="text-xs font-bold mt-1 leading-none">
                        {event.start_time.slice(0, 5)}
                      </p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{event.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {event.location && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-0.5 truncate">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </span>
                        )}
                        {event.game_type && (
                          <span className="text-[11px] text-gray-400 shrink-0">
                            · {gameTypeLabels[event.game_type] || event.game_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Count */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-gray-500">
                        <span className="text-[#4CAF50] font-bold">{event.attending_count || 0}</span>
                        /{event.max_participants || "∞"}명
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
