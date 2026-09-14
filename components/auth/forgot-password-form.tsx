"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      // Same request/response either way — the API never reveals whether
      // the email is registered, so there's nothing to branch on here.
      await api.auth.forgotPassword({ email }).catch(() => {});
      setSent(true);
    });
  }

  return (
    <Card className="mx-auto mt-12 w-full max-w-sm p-6">
      <h1 className="mb-1 text-xl font-semibold">Reset your password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        <Link href="/login" className="underline">
          Back to log in
        </Link>
      </p>

      {sent ? (
        <p className="text-sm">
          If an account exists for that email, we&apos;ve sent a link to reset
          the password. It expires in 1 hour.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isPending} className="mt-2">
            Send reset link
          </Button>
        </form>
      )}
    </Card>
  );
}
