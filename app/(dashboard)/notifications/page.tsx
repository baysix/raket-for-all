"use client";

import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">알림</h1>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Bell className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium mb-1">알림이 없습니다.</p>
        <p className="text-xs text-gray-400">
          일정 참석, 댓글, 공지사항 등의 알림이 여기에 표시됩니다.
        </p>
      </div>
    </div>
  );
}
