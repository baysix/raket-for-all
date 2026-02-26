"use client";

import Link from "next/link";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Clock,
  MapPin,
  Users,
  ChevronRight,
} from "lucide-react";
import type { Event } from "@/types";

function getDateLabel(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return "오늘";
  if (isTomorrow(date)) return "내일";
  return format(date, "M월 d일 (EEE)", { locale: ko });
}

const gameTypeLabels: Record<string, string> = {
  rally: "랠리",
  singles: "단식",
  doubles: "복식",
  mixed_doubles: "혼복",
};

export function EventCard({ event }: { event: Event }) {
  const dateLabel = getDateLabel(event.event_date);
  const isEventToday = isToday(parseISO(event.event_date));
  const attendingCount = event.attending_count || 0;

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-white border border-gray-100 rounded-xl p-4 active:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Date badge */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  isEventToday
                    ? "bg-[#4CAF50] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {dateLabel}
              </span>
              {event.game_type && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200 text-gray-500">
                  {gameTypeLabels[event.game_type] || event.game_type}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-base truncate">
              {event.title}
            </h3>

            {/* Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {event.start_time.slice(0, 5)} ~ {event.end_time.slice(0, 5)}
                </span>
              </div>

              {event.location && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {event.location}
                    {event.court_info && ` ${event.court_info}`}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {attendingCount}명 참석
                  {event.max_participants && (
                    <span className="text-xs">
                      {" "}
                      / {event.max_participants}명
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
        </div>
      </div>
    </Link>
  );
}
