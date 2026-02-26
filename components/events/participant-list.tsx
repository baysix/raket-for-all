"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { EventRsvp } from "@/types";

interface ParticipantListProps {
  rsvps: EventRsvp[];
}

export function ParticipantList({ rsvps }: ParticipantListProps) {
  const attending = rsvps.filter((r) => r.status === "attending");
  const waiting = rsvps.filter((r) => r.status === "waiting");

  return (
    <div className="space-y-4">
      {/* Attending */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h4 className="font-medium text-sm">참석</h4>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#4CAF50]">
            {attending.length}명
          </span>
        </div>
        {attending.length === 0 ? (
          <p className="text-sm text-gray-400">아직 참석자가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {attending.map((rsvp) => (
              <div key={rsvp.id} className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={rsvp.user?.profile_image || undefined} />
                  <AvatarFallback className="text-xs bg-[#E8F5E9] text-[#4CAF50]">
                    {(rsvp.user?.nickname || rsvp.user?.name || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {rsvp.user?.nickname || rsvp.user?.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waiting */}
      {waiting.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="font-medium text-sm text-amber-500">대기</h4>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-500">
              {waiting.length}명
            </span>
          </div>
          <div className="space-y-2">
            {waiting.map((rsvp) => (
              <div key={rsvp.id} className="flex items-center gap-3 opacity-70">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={rsvp.user?.profile_image || undefined} />
                  <AvatarFallback className="text-xs bg-amber-50 text-amber-500">
                    {(rsvp.user?.nickname || rsvp.user?.name || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {rsvp.user?.nickname || rsvp.user?.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
