import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  // ResetPasswordForm reads ?token= via useSearchParams(), which Next.js
  // requires a Suspense boundary for.
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
