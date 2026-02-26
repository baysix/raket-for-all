import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gray-100">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
