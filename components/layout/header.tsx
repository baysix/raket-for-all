"use client";

import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/racket_logo.png"
            alt="라켓포올"
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-lg">라켓포올</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative flex items-center justify-center w-10 h-10 active:bg-gray-50 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
          </Link>

          {session?.user && (
            <Link href="/mypage">
              <Avatar className="w-8 h-8">
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback className="text-xs bg-[#E8F5E9] text-[#4CAF50] font-medium">
                  {(session.user.nickname || session.user.name || "U").charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
