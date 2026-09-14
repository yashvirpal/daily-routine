"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  ChartNoAxesColumn,
  ClipboardList,
  ListChecks,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** An admin's whole nav — their own pages plus the admin section, as one
 * sidebar (see the "Menu"/"Admin" grouping below) — replaces the header
 * nav entirely for an ADMIN; regular users keep the header nav instead
 * (see components/nav.tsx). */
const personalLinks = [
  { href: "/today", label: "Today", icon: CalendarCheck, match: (p: string) => p.startsWith("/today") },
  { href: "/analytics", label: "Analytics", icon: ListChecks, match: (p: string) => p === "/analytics" },
  { href: "/settings", label: "Settings", icon: Settings, match: (p: string) => p === "/settings" },
];

const adminLinks = [
  { href: "/admin", label: "Users", icon: Users, match: (p: string) => p === "/admin" || p.startsWith("/admin/users") },
  { href: "/admin/routines", label: "Routines", icon: ClipboardList, match: (p: string) => p.startsWith("/admin/routines") },
  { href: "/admin/analytics", label: "Analytics", icon: ChartNoAxesColumn, match: (p: string) => p.startsWith("/admin/analytics") },
  { href: "/admin/settings", label: "Settings", icon: Settings, match: (p: string) => p.startsWith("/admin/settings") },
];

function SidebarGroup({
  label,
  links,
  pathname,
}: {
  label: string;
  links: typeof personalLinks;
  pathname: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 text-xs font-medium tracking-wide text-muted-foreground/70 uppercase">
        {label}
      </p>
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
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 flex-col gap-4 sm:w-44">
      <SidebarGroup label="Menu" links={personalLinks} pathname={pathname} />
      <SidebarGroup label="Admin" links={adminLinks} pathname={pathname} />
    </nav>
  );
}
