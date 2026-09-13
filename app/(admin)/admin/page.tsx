import { redirect } from "next/navigation";
import { TablePagination } from "@/components/admin/table-pagination";
import { TableSearch } from "@/components/admin/table-search";
import { UserTable } from "@/components/admin/user-table";
import { getSession } from "@/lib/auth";
import { listAllUsers } from "@/lib/server/admin";

const PAGE_SIZE = 10;

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin">) {
  // AdminLayout already redirects anything but a signed-in admin away —
  // this check just narrows the type without an assertion.
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "";
  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageParam) || 1);

  const { items: users, total } = await listAllUsers({ q, page, pageSize: PAGE_SIZE });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Every account registered in the app.
        </p>
      </div>
      <TableSearch basePath="/admin" initialQuery={q} placeholder="Search name or email…" />
      <UserTable users={users} total={total} currentAdminId={session.sub} />
      <TablePagination basePath="/admin" query={q} page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}
