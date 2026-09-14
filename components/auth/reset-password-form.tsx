"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!token) {
      setError("This reset link is missing its token — request a new one.");
      return;
    }

    startTransition(async () => {
      try {
        await api.auth.resetPassword({ token, newPassword });
        router.push("/login");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Couldn't reset your password.",
        );
      }
    });
  }

  return (
    <Card className="mx-auto mt-12 w-full max-w-sm p-6">
      <h1 className="mb-1 text-xl font-semibold">Choose a new password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        <Link href="/login" className="underline">
          Back to log in
        </Link>
      </p>

      {!token ? (
        <p className="text-sm text-destructive">
          This link is missing its reset token.{" "}
          <Link href="/forgot-password" className="underline">
            Request a new one
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isPending} className="mt-2">
            Reset password
          </Button>
        </form>
      )}
    </Card>
  );
}
