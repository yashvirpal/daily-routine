import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Plain-link pagination (no client JS needed) — preserves `q` across pages. */
export function TablePagination({
  basePath,
  query,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  query?: string;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function href(p: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{total} total</span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={href(page - 1)}>Previous</Link>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled>
            Previous
          </Button>
        )}
        <span className="tabular-nums">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={href(page + 1)}>Next</Link>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
