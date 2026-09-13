"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesColumn, ClipboardList, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Users", icon: Users, match: (p: string) => p === "/admin" || p.startsWith("/admin/users") },
  { href: "/admin/routines", label: "Routines", icon: ClipboardList, match: (p: string) => p.startsWith("/admin/routines") },
  { href: "/admin/analytics", label: "Analytics", icon: ChartNoAxesColumn, match: (p: string) => p.startsWith("/admin/analytics") },
  { href: "/admin/settings", label: "Settings", icon: Settings, match: (p: string) => p.startsWith("/admin/settings") },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto sm:w-40 sm:flex-col sm:overflow-visible">
      {links.map(({ href, label, icon: Icon, match }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
            match(pathname)
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
