"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  CalendarDays,
  FileText,
  Ticket,
  Shield,
  Copy,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [codes, setCodes] = useState<
    Array<{
      id: string;
      code: string;
      role: string;
      max_uses: number;
      used_count: number;
      expires_at: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [newCode, setNewCode] = useState({ role: "member", maxUses: "50" });

  const isAdmin =
    session?.user?.role === "platform_admin" ||
    session?.user?.role === "club_admin";

  useEffect(() => {
    if (!isAdmin) {
      router.push("/");
      return;
    }
    fetchCodes();
  }, [isAdmin, router]);

  const fetchCodes = async () => {
    try {
      const res = await fetch("/api/invite-codes");
      const result = await res.json();
      if (result.success) {
        setCodes(result.data);
      }
    } catch {
      // silently fail
    }
  };

  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: newCode.role,
          maxUses: parseInt(newCode.maxUses),
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("초대코드가 생성되었습니다!");
        fetchCodes();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("코드가 복사되었습니다!");
  };

  if (!isAdmin) return null;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <Shield className="w-5 h-5 text-purple-500" />
        관리자
      </h1>

      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: "회원", value: "-", bg: "bg-blue-50", color: "text-blue-500" },
          { icon: CalendarDays, label: "일정", value: "-", bg: "bg-[#E8F5E9]", color: "text-[#4CAF50]" },
          { icon: FileText, label: "게시글", value: "-", bg: "bg-amber-50", color: "text-amber-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-1`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Invite code generator */}
      <div>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-[#4CAF50]" />
          초대코드 관리
        </h2>

        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">부여 역할</Label>
              <Select
                value={newCode.role}
                onValueChange={(v) =>
                  setNewCode((prev) => ({ ...prev, role: v }))
                }
              >
                <SelectTrigger className="h-10 rounded-lg border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">회원</SelectItem>
                  <SelectItem value="club_admin">동호회 운영자</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">최대 사용 횟수</Label>
              <Input
                type="number"
                value={newCode.maxUses}
                onChange={(e) =>
                  setNewCode((prev) => ({ ...prev, maxUses: e.target.value }))
                }
                min={1}
                className="h-10 rounded-lg border-gray-200"
              />
            </div>
          </div>
          <button
            onClick={generateCode}
            className="w-full h-11 bg-[#4CAF50] hover:bg-[#43A047] active:bg-[#388E3C] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            초대코드 생성
          </button>
        </div>
      </div>

      {/* Existing codes */}
      {codes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400">
            발급된 초대코드
          </h3>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {codes.map((code) => (
              <div key={code.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono font-bold text-sm">
                      {code.code}
                    </code>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200 text-gray-500">
                      {code.role === "club_admin" ? "운영자" : "회원"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {code.used_count}/{code.max_uses}회 사용
                  </p>
                </div>
                <button
                  onClick={() => copyCode(code.code)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg active:bg-gray-100 transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
