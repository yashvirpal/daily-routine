import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/today");

  // The sidebar itself now lives in the root layout (an admin's whole nav,
  // not just /admin/* — see components/app-sidebar.tsx) — this layout is
  // just the access guard for the /admin/* route group.
  return <>{children}</>;
}
