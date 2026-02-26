"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  format,
  parseISO,
  isSameDay,
  isToday,
  isTomorrow,
  isBefore,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import {
  CalendarDays,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event } from "@/types";

const gameTypeLabels: Record<string, string> = {
  rally: "랠리",
  singles: "단식",
  doubles: "복식",
  mixed_doubles: "혼복",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDateLabel(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return "오늘";
  if (isTomorrow(date)) return "내일";
  return format(date, "M.dd(EEE)", { locale: ko });
}

export default function SchedulePage() {
  return (
    <Suspense fallback={
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    }>
      <ScheduleContent />
    </Suspense>
  );
}

function ScheduleContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tab, setTab] = useState<"calendar" | "list">(
    searchParams.get("tab") === "list" ? "list" : "calendar"
  );

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events?limit=100&upcoming=false");
        const result = await res.json();
        if (result.success) {
          setEvents(result.data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // 내가 참석 중인 일정만
  const myEvents = useMemo(() => {
    if (!user?.id) return [];
    return events.filter((e) =>
      e.rsvps?.some(
        (r) => r.user_id === user?.id && r.status === "attending"
      )
    );
  }, [events, user?.id]);

  // 캘린더: 선택 날짜의 내 일정
  const selectedDateEvents = useMemo(() => {
    return myEvents.filter((e) =>
      isSameDay(parseISO(e.event_date), selectedDate)
    );
  }, [myEvents, selectedDate]);

  // 캘린더 점 표시용
  const eventDatesInMonth = useMemo(() => {
    const set = new Set<string>();
    myEvents.forEach((e) => set.add(e.event_date));
    return set;
  }, [myEvents]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const paddingBefore = Array(getDay(monthStart)).fill(null);
    return [...paddingBefore, ...days];
  }, [currentMonth]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="px-4 pt-4">
        <h1 className="text-lg font-bold">내 일정</h1>
      </div>

      {/* Tab */}
      <div className="px-4 flex gap-2">
        <button
          onClick={() => setTab("calendar")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            tab === "calendar"
              ? "bg-[#4CAF50] text-white"
              : "bg-gray-100 text-gray-500 active:bg-gray-200"
          }`}
        >
          내 일정
        </button>
        <button
          onClick={() => setTab("list")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            tab === "list"
              ? "bg-[#4CAF50] text-white"
              : "bg-gray-100 text-gray-500 active:bg-gray-200"
          }`}
        >
          전체 일정
        </button>
      </div>

      {tab === "calendar" ? (
        <>
          {/* Calendar */}
          <div className="px-4">
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {/* Month navigation */}
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <h2 className="text-sm font-bold">
                  {format(currentMonth, "yyyy년 M월", { locale: ko })}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 px-2">
                {WEEKDAYS.map((day, i) => (
                  <div
                    key={day}
                    className={`text-center text-[11px] font-medium py-1.5 ${
                      i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 px-2 pb-3">
                {calendarDays.map((day, i) => {
                  if (!day) {
                    return <div key={`empty-${i}`} className="aspect-square" />;
                  }

                  const dateStr = format(day, "yyyy-MM-dd");
                  const hasEvent = eventDatesInMonth.has(dateStr);
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const isPast = isBefore(day, startOfDay(new Date())) && !isTodayDate;
                  const dayOfWeek = getDay(day);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(day)}
                      className="flex flex-col items-center justify-center aspect-square relative"
                    >
                      <div
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ${
                          isSelected
                            ? "bg-[#4CAF50] text-white font-bold"
                            : isTodayDate
                              ? "bg-[#E8F5E9] text-[#4CAF50] font-semibold"
                              : isPast
                                ? "text-gray-300"
                                : dayOfWeek === 0
                                  ? "text-red-500"
                                  : dayOfWeek === 6
                                    ? "text-blue-500"
                                    : "text-gray-800"
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                      {hasEvent && (
                        <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? "bg-white" : "bg-[#4CAF50]"}`} />
                      )}
                      {!hasEvent && <div className="w-1 h-1 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected date events */}
          <div className="px-4 pb-4">
            <h3 className="font-bold text-sm mb-3">
              {format(selectedDate, "M월 d일 (EEE)", { locale: ko })}
              <span className="text-gray-400 font-normal ml-1.5">
                {selectedDateEvents.length}개
              </span>
            </h3>

            {selectedDateEvents.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">이 날 참여 일정이 없습니다</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedDateEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* 전체 일정 리스트 (달력 없이) */
        <div className="px-4 pb-4">
          {myEvents.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">참석 중인 일정이 없습니다</p>
              <Link
                href="/events"
                className="inline-block mt-3 text-sm font-medium text-[#4CAF50] active:text-[#388E3C]"
              >
                일정 둘러보기
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myEvents.map((event) => (
                <EventCard key={event.id} event={event} showDate />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, showDate = false }: { event: Event; showDate?: boolean }) {
  const dateLabel = getDateLabel(event.event_date);
  const isTodayEvent = isToday(parseISO(event.event_date));

  return (
    <Link href={`/events/${event.id}`} className="block">
      <div className="bg-white border border-gray-100 rounded-xl p-4 active:bg-gray-50 transition-colors">
        {/* Top: location + count */}
        <div className="flex items-center justify-between mb-1.5">
          {event.location ? (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.location}
              {event.court_info && ` · ${event.court_info}`}
            </span>
          ) : (
            <span />
          )}
          <span className="text-xs font-medium text-gray-500">
            <span className="text-[#4CAF50] font-bold">{event.attending_count || 0}</span>
            {event.max_participants ? `/${event.max_participants}` : ""}명
          </span>
        </div>

        {/* Title */}
        <h4 className="font-bold text-[15px] leading-snug mb-2 truncate">
          {event.title}
        </h4>

        {/* Date + Time */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          {showDate && (
            <>
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              <span className={isTodayEvent ? "text-[#4CAF50] font-semibold" : ""}>
                {dateLabel}
              </span>
              <span className="text-gray-300">|</span>
            </>
          )}
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{event.start_time.slice(0, 5)}~{event.end_time.slice(0, 5)}</span>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5">
          {event.game_type && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-0.5">
              <Gamepad2 className="w-3 h-3" />
              {gameTypeLabels[event.game_type] || event.game_type}
            </span>
          )}
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#4CAF50]">
            참석
          </span>
        </div>
      </div>
    </Link>
  );
}
