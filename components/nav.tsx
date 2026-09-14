"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarCheck, ListChecks, Settings } from "lucide-react";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { api } from "@/lib/api";

const links = [
  { href: "/today", label: "Today", icon: CalendarCheck },
  { href: "/analytics", label: "Analytics", icon: ListChecks },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav({ user, siteName }: { user: User | null; siteName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  // An admin's nav is the sidebar (see AppSidebar) — the header stays but
  // drops the links, rather than showing the same destinations twice.
  const isAdmin = user?.role === "ADMIN";

  async function logout() {
    await api.auth.logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3">
        <span className="mr-2 shrink-0 font-semibold whitespace-nowrap sm:mr-4">
          {siteName}
        </span>
        {user &&
          !isAdmin &&
          links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground sm:px-3",
                pathname.startsWith(href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.name ?? user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
