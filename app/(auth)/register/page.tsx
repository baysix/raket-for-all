"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { InviteCodeForm } from "@/components/auth/invite-code-form";
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

function RegisterContent() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") || undefined;
  const prefillName = searchParams.get("name") || undefined;
  const prefillImage = searchParams.get("image") || undefined;

  const [verifiedData, setVerifiedData] = useState<{
    codeId: string;
    clubId: string;
    clubName: string;
    role: string;
    inviteCode: string;
  } | null>(null);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#E8F5E9] to-white">
      {!verifiedData ? (
        <InviteCodeForm onVerified={setVerifiedData} />
      ) : (
        <RegisterForm
          clubName={verifiedData.clubName}
          clubId={verifiedData.clubId}
          inviteCode={verifiedData.inviteCode}
          role={verifiedData.role}
          prefillEmail={prefillEmail}
          prefillName={prefillName}
          prefillImage={prefillImage}
        />
      )}

      <p className="mt-4 text-sm text-gray-400">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-[#4CAF50] font-medium hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
