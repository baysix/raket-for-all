"use client";

import { EventForm } from "@/components/events/event-form";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewEventPage() {
  const router = useRouter();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">일정 등록</h1>
      </div>

      <EventForm />
    </div>
  );
}
