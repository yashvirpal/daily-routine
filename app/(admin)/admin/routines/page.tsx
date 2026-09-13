import { TablePagination } from "@/components/admin/table-pagination";
import { TableSearch } from "@/components/admin/table-search";
import { RoutineTable } from "@/components/admin/routine-table";
import { listAllRoutines } from "@/lib/server/admin";

const PAGE_SIZE = 10;

export default async function AdminRoutinesPage({
  searchParams,
}: PageProps<"/admin/routines">) {
  // AdminLayout already redirects anything but a signed-in admin away.
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "";
  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageParam) || 1);

  const { items: routines, total } = await listAllRoutines({
    q,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Routines</h1>
        <p className="text-sm text-muted-foreground">
          Every routine across every user.
        </p>
      </div>
      <TableSearch
        basePath="/admin/routines"
        initialQuery={q}
        placeholder="Search routine or owner email…"
      />
      <RoutineTable routines={routines} total={total} />
      <TablePagination
        basePath="/admin/routines"
        query={q}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
      />
    </div>
  );
}
