"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  LogOut,
  CalendarDays,
  FileText,
  Trophy,
  Shield,
  ChevronRight,
  Pencil,
  MessageSquare,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PwaInstallButton } from "@/components/pwa-install-prompt";
import Link from "next/link";

const roleLabels: Record<string, string> = {
  platform_admin: "플랫폼 운영자",
  club_admin: "동호회 운영자",
  member: "회원",
};

const roleBadgeColors: Record<string, string> = {
  platform_admin: "bg-purple-100 text-purple-700",
  club_admin: "bg-blue-100 text-blue-700",
  member: "bg-[#E8F5E9] text-[#4CAF50]",
};

const genderLabels: Record<string, string> = {
  male: "남자",
  female: "여자",
};

const ntrpLabels: Record<string, string> = {
  "1.0": "1.0 (입문)",
  "1.5": "1.5",
  "2.0": "2.0 (초급)",
  "2.5": "2.5",
  "3.0": "3.0 (중하)",
  "3.5": "3.5",
  "4.0": "4.0 (중급)",
  "4.5": "4.5",
  "5.0": "5.0 (중상)",
  "5.5": "5.5",
  "6.0": "6.0 (상급)",
  "6.5": "6.5",
  "7.0": "7.0 (프로)",
};

function calcExperience(startDate: string | null): string | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (totalMonths < 0) return null;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0 && months === 0) return "1개월 미만";
  if (years === 0) return `${months}개월차`;
  if (months === 0) return `${years}년차`;
  return `${years}년 ${months}개월차`;
}

interface ProfileData {
  id: string;
  nickname: string | null;
  name: string;
  email: string;
  profile_image: string | null;
  role: string;
  gender: string | null;
  tennis_start_date: string | null;
  ntrp_level: string | null;
  bio: string | null;
  created_at: string;
  stats: {
    attendance_count: number;
    post_count: number;
    comment_count: number;
  };
}

export default function MyPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const result = await res.json();
      if (result.success) {
        setProfile(result.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const isAdmin =
    session?.user?.role === "platform_admin" ||
    session?.user?.role === "club_admin";

  const experience = calcExperience(profile?.tennis_start_date ?? null);
  const subtitle = [experience, profile?.gender ? genderLabels[profile.gender] : null]
    .filter(Boolean)
    .join(", ");

  const menuSections = [
    {
      title: "활동",
      items: [
        {
          icon: CalendarDays,
          label: "내 일정",
          href: "/events",
          color: "text-blue-500",
          bg: "bg-blue-50",
        },
        {
          icon: FileText,
          label: "내 게시글",
          href: "/community",
          color: "text-[#4CAF50]",
          bg: "bg-[#E8F5E9]",
        },
        {
          icon: Trophy,
          label: "참여 랭킹",
          href: "/rankings",
          color: "text-amber-500",
          bg: "bg-amber-50",
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "관리",
            items: [
              {
                icon: Shield,
                label: "관리자 메뉴",
                href: "/admin",
                color: "text-purple-500",
                bg: "bg-purple-50",
              },
            ],
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">내 정보</h1>
        <Link
          href="/mypage/edit"
          className="flex items-center gap-1 text-sm text-gray-500 active:text-gray-700 transition-colors"
        >
          수정하기
        </Link>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.profile_image || undefined} />
              <AvatarFallback className="text-2xl bg-[#E8F5E9] text-[#4CAF50] font-bold">
                {(profile?.nickname || profile?.name || "U").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Link
              href="/mypage/edit"
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5 text-gray-500" />
            </Link>
          </div>
          <h2 className="text-lg font-bold">
            {profile?.nickname || profile?.name}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
          )}
          <span
            className={`inline-block mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full ${
              roleBadgeColors[profile?.role || "member"]
            }`}
          >
            {roleLabels[profile?.role || "member"]}
          </span>
          {profile?.bio && (
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Tennis info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">테니스 정보</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-[11px] text-gray-400 mb-1">NTRP 레벨</p>
            <p className="text-base font-bold text-[#4CAF50]">
              {profile?.ntrp_level
                ? ntrpLabels[profile.ntrp_level] || profile.ntrp_level
                : "-"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-[11px] text-gray-400 mb-1">테니스 경력</p>
            <p className="text-base font-bold text-gray-800">
              {experience || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Activity stats */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">활동 통계</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center py-2">
            <div className="w-9 h-9 mx-auto mb-1.5 rounded-full bg-blue-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-lg font-bold">{profile?.stats.attendance_count || 0}</p>
            <p className="text-[11px] text-gray-400">참여</p>
          </div>
          <div className="text-center py-2">
            <div className="w-9 h-9 mx-auto mb-1.5 rounded-full bg-[#E8F5E9] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#4CAF50]" />
            </div>
            <p className="text-lg font-bold">{profile?.stats.post_count || 0}</p>
            <p className="text-[11px] text-gray-400">게시글</p>
          </div>
          <div className="text-center py-2">
            <div className="w-9 h-9 mx-auto mb-1.5 rounded-full bg-amber-50 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-lg font-bold">{profile?.stats.comment_count || 0}</p>
            <p className="text-[11px] text-gray-400">댓글</p>
          </div>
        </div>
      </div>

      {/* Menu sections */}
      {menuSections.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-semibold text-gray-400 mb-2 px-1">
            {section.title}
          </h3>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
            {section.items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 p-4 active:bg-gray-50 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}
                >
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="flex-1 text-sm font-medium">
                  {item.label}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* 앱 설치 */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <PwaInstallButton />
      </div>

      {/* Logout */}
      <button
        className="w-full h-12 flex items-center justify-center gap-2 border border-gray-200 text-red-500 text-sm font-medium rounded-xl active:bg-gray-50 transition-colors"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4" />
        로그아웃
      </button>
    </div>
  );
}
