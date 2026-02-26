"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const { refresh } = useAuth();

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.error || "이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      await refresh();
      router.push("/");
      router.refresh();
    } catch {
      setError("로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // const handleKakaoLogin = async () => {
  //   await signIn("kakao", { callbackUrl: "/" });
  // };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 pb-0 text-center">
        <div className="mx-auto mb-4">
          <img
            src="/racket_logo.png"
            alt="라켓포올"
            className="w-36 h-36 mx-auto object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold">라켓포올</h1>
        <p className="text-gray-400 text-sm mt-1">
          테니스 동호회 플랫폼
        </p>
      </div>

      <div className="p-6 space-y-4">
        {registered && (
          <div className="bg-[#E8F5E9] text-[#388E3C] text-sm p-3 rounded-lg text-center font-medium">
            회원가입이 완료되었습니다! 로그인해주세요.
          </div>
        )}

        {/* 카카오 로그인 - 추후 활성화 */}
        {/* <button
          type="button"
          className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD800] active:bg-[#FCCC00] text-[#191919] font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          onClick={handleKakaoLogin}
          disabled={kakaoLoading}
        >
          {kakaoLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.84 5.18 4.6 6.56-.2.72-.74 2.62-.84 3.04-.14.52.18.52.4.38.16-.1 2.56-1.74 3.6-2.44.72.1 1.48.16 2.24.16 5.52 0 10-3.48 10-7.7S17.52 3 12 3z"/>
            </svg>
          )}
          카카오로 시작하기
        </button>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400">
            또는
          </span>
        </div> */}

        <form onSubmit={handleCredentialLogin} className="space-y-4">
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
              placeholder="비밀번호를 입력하세요"
              value={form.password}
              onChange={handleChange}
              required
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
              "로그인"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          아직 회원이 아니신가요?{" "}
          <Link href="/register" className="text-[#4CAF50] font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
