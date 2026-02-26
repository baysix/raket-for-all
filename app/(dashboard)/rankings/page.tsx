"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { RankingEntry } from "@/types";

export default function RankingsPage() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchRankings();
  }, [period]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rankings?period=${period}`);
      const result = await res.json();
      if (result.success) {
        setRankings(result.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        참여 랭킹
      </h1>

      {/* Period tabs */}
      <div className="flex gap-2">
        {[
          { value: "month", label: "이번 달" },
          { value: "all", label: "전체" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPeriod(tab.value)}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
              period === tab.value
                ? "bg-[#4CAF50] text-white"
                : "bg-gray-100 text-gray-500 active:bg-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-xl" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-16">
          <Medal className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">
            아직 참석 기록이 없습니다.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            일정에 참석하면 랭킹에 반영됩니다!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 podium */}
          {top3.length > 0 && (
            <div className="bg-gradient-to-b from-amber-50 to-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-end justify-center gap-4">
                {/* 2nd place */}
                {top3[1] && (
                  <div className="flex flex-col items-center">
                    <Avatar className="w-14 h-14 border-2 border-gray-300">
                      <AvatarImage
                        src={top3[1].profile_image || undefined}
                      />
                      <AvatarFallback className="bg-gray-100 text-gray-600">
                        {(
                          top3[1].nickname || top3[1].name
                        ).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium mt-2">
                      {top3[1].nickname || top3[1].name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {top3[1].attendance_count}회
                    </span>
                    <div className="w-16 h-16 bg-gray-200 rounded-t-lg mt-2 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-500">
                        2
                      </span>
                    </div>
                  </div>
                )}

                {/* 1st place */}
                <div className="flex flex-col items-center">
                  <div className="text-2xl mb-1">👑</div>
                  <Avatar className="w-16 h-16 border-2 border-yellow-400">
                    <AvatarImage
                      src={top3[0].profile_image || undefined}
                    />
                    <AvatarFallback className="bg-yellow-100 text-yellow-700">
                      {(top3[0].nickname || top3[0].name).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-bold mt-2">
                    {top3[0].nickname || top3[0].name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {top3[0].attendance_count}회
                  </span>
                  <div className="w-16 h-24 bg-yellow-200 rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-2xl font-bold text-yellow-600">
                      1
                    </span>
                  </div>
                </div>

                {/* 3rd place */}
                {top3[2] && (
                  <div className="flex flex-col items-center">
                    <Avatar className="w-14 h-14 border-2 border-amber-600">
                      <AvatarImage
                        src={top3[2].profile_image || undefined}
                      />
                      <AvatarFallback className="bg-amber-100 text-amber-700">
                        {(
                          top3[2].nickname || top3[2].name
                        ).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium mt-2">
                      {top3[2].nickname || top3[2].name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {top3[2].attendance_count}회
                    </span>
                    <div className="w-16 h-12 bg-amber-200 rounded-t-lg mt-2 flex items-center justify-center">
                      <span className="text-xl font-bold text-amber-600">
                        3
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rest of rankings */}
          {rest.length > 0 && (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {rest.map((entry) => (
                <div
                  key={entry.user_id}
                  className="p-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-gray-400">
                      {entry.rank}
                    </span>
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={entry.profile_image || undefined}
                    />
                    <AvatarFallback className="text-sm bg-[#E8F5E9] text-[#4CAF50]">
                      {(entry.nickname || entry.name).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {entry.nickname || entry.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="font-medium">
                      {entry.attendance_count}회
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
