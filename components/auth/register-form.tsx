"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";

interface RegisterFormProps {
  clubName: string;
  clubId: string;
  inviteCode: string;
  role: string;
  prefillEmail?: string;
  prefillName?: string;
  prefillImage?: string;
}

export function RegisterForm({
  clubName,
  inviteCode,
  prefillEmail,
  prefillName,
}: RegisterFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: prefillEmail || "",
    password: "",
    passwordConfirm: "",
    name: prefillName || "",
    nickname: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (form.password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          nickname: form.nickname,
          phone: form.phone,
          inviteCode,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/login?registered=true");
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
          <UserPlus className="w-8 h-8 text-[#4CAF50]" />
        </div>
        <h1 className="text-2xl font-bold">회원가입</h1>
        <span className="inline-block mt-2 px-3 py-1 bg-[#E8F5E9] text-[#4CAF50] text-sm font-medium rounded-full">
          {clubName}
        </span>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={handleChange}
              required
              className="h-12 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="6자 이상"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="h-12 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700">비밀번호 확인</Label>
            <Input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              placeholder="비밀번호를 다시 입력"
              value={form.passwordConfirm}
              onChange={handleChange}
              required
              className="h-12 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">이름</Label>
              <Input
                id="name"
                name="name"
                placeholder="홍길동"
                value={form.name}
                onChange={handleChange}
                required
                className="h-12 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-sm font-medium text-gray-700">닉네임</Label>
              <Input
                id="nickname"
                name="nickname"
                placeholder="테니스왕"
                value={form.nickname}
                onChange={handleChange}
                required
                className="h-12 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">전화번호 (선택)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="010-1234-5678"
              value={form.phone}
              onChange={handleChange}
              className="h-12 rounded-lg border-gray-200 focus:border-[#4CAF50] focus:ring-[#4CAF50]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full h-12 bg-[#4CAF50] hover:bg-[#43A047] active:bg-[#388E3C] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              "가입하기"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
