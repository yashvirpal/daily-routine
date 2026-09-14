import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  // ResetPasswordForm reads ?token= via useSearchParams(), which Next.js
  // requires a Suspense boundary for.
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
