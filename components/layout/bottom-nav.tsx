"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, CalendarDays, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/events", icon: ClipboardList, label: "일정" },
  { href: "/schedule", icon: CalendarDays, label: "내 일정" },
  { href: "/community", icon: MessageCircle, label: "커뮤니티" },
  { href: "/mypage", icon: User, label: "내 정보" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-t border-gray-100 safe-area-bottom shrink-0">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors",
                isActive
                  ? "text-[#4CAF50]"
                  : "text-gray-400 active:text-gray-600"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "w-[22px] h-[22px]")} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
