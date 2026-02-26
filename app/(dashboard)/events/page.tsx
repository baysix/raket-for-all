"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/components/auth/auth-context";
import Link from "next/link";
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns";
import { ko } from "date-fns/locale";
import {
  Plus,
  CalendarDays,
  MapPin,
  Clock,
  Gamepad2,
  ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event } from "@/types";

function getDateLabel(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return "오늘";
  if (isTomorrow(date)) return "내일";
  return format(date, "M.dd(EEE)", { locale: ko });
}

const gameTypeLabels: Record<string, string> = {
  rally: "랠리",
  singles: "단식",
  doubles: "복식",
  mixed_doubles: "혼복",
};

const dateFilterOptions = [
  { value: "today", label: "오늘" },
  { value: "tomorrow", label: "내일" },
  { value: "this_week", label: "이번주" },
];

const timeFilterOptions = [
  { value: "morning", label: "오전 (6~12시)" },
  { value: "afternoon", label: "오후 (12~18시)" },
  { value: "evening", label: "저녁 (18~22시)" },
];

const gameTypeFilterOptions = [
  { value: "rally", label: "랠리" },
  { value: "singles", label: "단식" },
  { value: "doubles", label: "복식" },
  { value: "mixed_doubles", label: "혼복" },
];

function FilterChip({
  label,
  value,
  isOpen,
  onToggle,
}: {
  label: string;
  value?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        value
          ? "bg-[#E8F5E9] text-[#4CAF50] border-[#4CAF50]/30"
          : isOpen
            ? "bg-gray-50 text-gray-700 border-gray-300"
            : "bg-white text-gray-600 border-gray-200 active:bg-gray-50"
      }`}
    >
      {value || label}
      <ChevronDown
        className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    gameType: "",
    date: "",
    time: "",
    available: false,
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events?limit=50&upcoming=true");
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filters.gameType && e.game_type !== filters.gameType) return false;

      if (filters.date === "today" && !isToday(parseISO(e.event_date)))
        return false;
      if (filters.date === "tomorrow" && !isTomorrow(parseISO(e.event_date)))
        return false;
      if (filters.date === "this_week") {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        if (
          !isWithinInterval(parseISO(e.event_date), {
            start: weekStart,
            end: weekEnd,
          })
        )
          return false;
      }

      if (filters.time) {
        const hour = parseInt(e.start_time.split(":")[0]);
        if (filters.time === "morning" && (hour < 6 || hour >= 12))
          return false;
        if (filters.time === "afternoon" && (hour < 12 || hour >= 18))
          return false;
        if (filters.time === "evening" && (hour < 18 || hour >= 22))
          return false;
      }

      if (
        filters.available &&
        e.max_participants &&
        (e.attending_count || 0) >= e.max_participants
      )
        return false;

      return true;
    });
  }, [events, filters]);

  const activeFilterCount = [
    filters.gameType,
    filters.date,
    filters.time,
    filters.available,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full rounded-full" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">일정</h1>
        <Link
          href="/events/new"
          className="flex items-center gap-1 px-3 py-2 bg-[#4CAF50] text-white text-sm font-semibold rounded-lg active:bg-[#43A047] transition-colors"
        >
          <Plus className="w-4 h-4" />
          등록
        </Link>
      </div>

      {/* Filter bar */}
      <div ref={filterRef} className="border-b border-gray-100">
        <div
          className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* 참여가능 toggle */}
          <button
            onClick={() => {
              setFilters((prev) => ({ ...prev, available: !prev.available }));
              setOpenFilter(null);
            }}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filters.available
                ? "bg-[#4CAF50] text-white border-[#4CAF50]"
                : "bg-white text-gray-600 border-gray-200 active:bg-gray-50"
            }`}
          >
            참여가능
          </button>

          <FilterChip
            label="날짜"
            value={
              filters.date
                ? dateFilterOptions.find((o) => o.value === filters.date)?.label
                : undefined
            }
            isOpen={openFilter === "date"}
            onToggle={() =>
              setOpenFilter(openFilter === "date" ? null : "date")
            }
          />

          <FilterChip
            label="시간"
            value={
              filters.time
                ? timeFilterOptions.find((o) => o.value === filters.time)?.label
                : undefined
            }
            isOpen={openFilter === "time"}
            onToggle={() =>
              setOpenFilter(openFilter === "time" ? null : "time")
            }
          />

          <FilterChip
            label="게임유형"
            value={
              filters.gameType
                ? gameTypeLabels[filters.gameType]
                : undefined
            }
            isOpen={openFilter === "gameType"}
            onToggle={() =>
              setOpenFilter(openFilter === "gameType" ? null : "gameType")
            }
          />

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setFilters({
                  gameType: "",
                  date: "",
                  time: "",
                  available: false,
                });
                setOpenFilter(null);
              }}
              className="shrink-0 text-xs text-gray-400 active:text-gray-600 px-1 underline"
            >
              초기화
            </button>
          )}
        </div>

        {/* Filter dropdown options */}
        {openFilter && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {openFilter === "date" &&
              dateFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      date: prev.date === opt.value ? "" : opt.value,
                    }));
                    setOpenFilter(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filters.date === opt.value
                      ? "bg-[#4CAF50] text-white"
                      : "bg-gray-100 text-gray-600 active:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            {openFilter === "time" &&
              timeFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      time: prev.time === opt.value ? "" : opt.value,
                    }));
                    setOpenFilter(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filters.time === opt.value
                      ? "bg-[#4CAF50] text-white"
                      : "bg-gray-100 text-gray-600 active:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            {openFilter === "gameType" &&
              gameTypeFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      gameType:
                        prev.gameType === opt.value ? "" : opt.value,
                    }));
                    setOpenFilter(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filters.gameType === opt.value
                      ? "bg-[#4CAF50] text-white"
                      : "bg-gray-100 text-gray-600 active:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Event list */}
      <div className="p-4">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-400 mb-1">
              {activeFilterCount > 0
                ? "조건에 맞는 일정이 없습니다"
                : "등록된 일정이 없습니다"}
            </p>
            {activeFilterCount > 0 ? (
              <button
                onClick={() =>
                  setFilters({
                    gameType: "",
                    date: "",
                    time: "",
                    available: false,
                  })
                }
                className="text-sm font-medium text-[#4CAF50] mt-2 active:text-[#388E3C]"
              >
                필터 초기화
              </button>
            ) : (
              <Link
                href="/events/new"
                className="flex items-center gap-1 px-4 py-2.5 mt-3 bg-[#4CAF50] text-white text-sm font-semibold rounded-lg active:bg-[#43A047] transition-colors"
              >
                <Plus className="w-4 h-4" />
                첫 일정 만들기
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">
              {filteredEvents.length}개의 일정
            </p>
            <div className="flex flex-col gap-3">
              {filteredEvents.map((event) => {
                const isAttending = event.rsvps?.some(
                  (r) =>
                    r.user_id === user?.id &&
                    r.status === "attending"
                );
                const dateLabel = getDateLabel(event.event_date);
                const isTodayEvent = isToday(parseISO(event.event_date));
                const isFull =
                  event.max_participants &&
                  (event.attending_count || 0) >= event.max_participants;

                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block"
                  >
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden active:bg-gray-50 transition-colors">
                      <div className="flex">
                        {/* Thumbnail */}
                        {event.image_url && (
                          <div className="w-28 shrink-0">
                            <img
                              src={event.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 p-4">
                          {/* Top row: location + count */}
                          <div className="flex items-center justify-between mb-1.5">
                            {event.location ? (
                              <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {event.location}
                                {event.court_info &&
                                  ` · ${event.court_info}`}
                              </span>
                            ) : (
                              <span />
                            )}
                            <span className="text-xs font-medium text-gray-500 shrink-0 ml-2">
                              <span className="text-[#4CAF50] font-bold">
                                {event.attending_count || 0}
                              </span>
                              {event.max_participants
                                ? `/${event.max_participants}`
                                : ""}
                              명
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-[15px] leading-snug mb-2 truncate">
                            {event.title}
                          </h3>

                          {/* Date / Time */}
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                            <span
                              className={
                                isTodayEvent
                                  ? "text-[#4CAF50] font-semibold"
                                  : ""
                              }
                            >
                              {dateLabel}
                            </span>
                            <span className="text-gray-300">|</span>
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {event.start_time.slice(0, 5)}~
                              {event.end_time.slice(0, 5)}
                            </span>
                          </div>

                          {/* Tags */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {event.game_type && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-0.5">
                                <Gamepad2 className="w-3 h-3" />
                                {gameTypeLabels[event.game_type] ||
                                  event.game_type}
                              </span>
                            )}
                            {isAttending && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#4CAF50]">
                                참석
                              </span>
                            )}
                            {isFull && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                                마감
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
