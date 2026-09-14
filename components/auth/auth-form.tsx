"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "login") {
          await api.auth.login({ email, password });
        } else {
          await api.auth.register({ email, password, name: name || undefined });
        }
        router.push("/today");
        router.refresh();
      } catch (err) {
        // Registration can fail for reasons worth showing verbatim (e.g.
        // registration closed) rather than the generic fallback below.
        setError(
          mode === "register" && err instanceof Error
            ? err.message
            : mode === "login"
              ? "Invalid email or password."
              : "Couldn't create an account — that email may already be registered.",
        );
      }
    });
  }

  return (
    <Card className="mx-auto mt-12 w-full max-w-sm p-6">
      <h1 className="mb-1 text-xl font-semibold">
        {mode === "login" ? "Log in" : "Create an account"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/register" className="underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </>
        )}
      </p>

      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === "register" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" && (
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isPending} className="mt-2">
          {mode === "login" ? "Log in" : "Create account"}
        </Button>
      </form>
    </Card>
  );
}
