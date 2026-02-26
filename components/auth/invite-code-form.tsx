"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Ticket } from "lucide-react";

interface InviteCodeFormProps {
  onVerified: (data: {
    codeId: string;
    clubId: string;
    clubName: string;
    role: string;
    inviteCode: string;
  }) => void;
}

export function InviteCodeForm({ onVerified }: InviteCodeFormProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/invite-codes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error);
        return;
      }

      onVerified({ ...result.data, inviteCode: code });
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 pb-0 text-center">
        <div className="mx-auto w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-4">
          <Ticket className="w-8 h-8 text-[#4CAF50]" />
        </div>
        <h1 className="text-2xl font-bold">초대코드 입력</h1>
        <p className="text-gray-400 text-sm mt-2">
          동호회 초대코드를 입력하여 가입을 시작하세요
        </p>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code" className="text-sm font-medium text-gray-700">초대코드</Label>
            <Input
              id="invite-code"
              placeholder="예: RACKET2026"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-12 text-center text-lg tracking-widest font-mono rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
              maxLength={20}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full h-12 bg-[#4CAF50] hover:bg-[#43A047] active:bg-[#388E3C] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            disabled={!code || loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              "코드 확인"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
