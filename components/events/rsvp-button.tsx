"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { Check, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EventRsvp } from "@/types";

interface RsvpButtonProps {
  eventId: string;
  rsvps: EventRsvp[];
  maxParticipants: number | null;
  onRsvpChange: () => void;
}

export function RsvpButton({
  eventId,
  rsvps,
  maxParticipants,
  onRsvpChange,
}: RsvpButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const myRsvp = rsvps.find((r) => r.user_id === user?.id);
  const attendingCount = rsvps.filter((r) => r.status === "attending").length;
  const isFull =
    maxParticipants !== null && attendingCount >= maxParticipants;

  const handleRsvp = async (status: "attending" | "waiting") => {
    if (!user) return;
    setLoading(status);

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (result.data.status === null) {
        toast.success("참석 여부가 취소되었습니다.");
      } else if (status === "attending") {
        toast.success("참석으로 등록되었습니다!");
      } else {
        toast.success("대기로 등록되었습니다.");
      }

      onRsvpChange();
    } catch {
      toast.error("처리에 실패했습니다.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        type="button"
        className={cn(
          "flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors",
          myRsvp?.status === "attending"
            ? "bg-[#4CAF50] text-white active:bg-[#388E3C]"
            : "border border-[#4CAF50] text-[#4CAF50] active:bg-[#E8F5E9]"
        )}
        onClick={() => handleRsvp("attending")}
        disabled={
          loading !== null ||
          (isFull && myRsvp?.status !== "attending")
        }
      >
        {loading === "attending" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        참석
        {isFull && myRsvp?.status !== "attending" && " (마감)"}
      </button>

      <button
        type="button"
        className={cn(
          "flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors",
          myRsvp?.status === "waiting"
            ? "bg-amber-500 text-white active:bg-amber-600"
            : "border border-amber-400 text-amber-500 active:bg-amber-50"
        )}
        onClick={() => handleRsvp("waiting")}
        disabled={loading !== null}
      >
        {loading === "waiting" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
        대기
      </button>
    </div>
  );
}
