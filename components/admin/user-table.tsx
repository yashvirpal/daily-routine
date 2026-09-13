import Link from "next/link";
import { ChartNoAxesColumn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import type { AdminUserSummary } from "@/lib/types";

export function UserTable({
  users,
  total,
  currentAdminId,
}: {
  users: AdminUserSummary[];
  total: number;
  currentAdminId: string;
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        Users ({total})
      </h2>
      <Card className="divide-y overflow-hidden p-0">
        {users.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No users match.</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4">
              <div>
                <p>
                  {u.name ?? u.email}{" "}
                  {u.role === "ADMIN" && (
                    <Badge variant="secondary" className="ml-1">
                      Admin
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex items-center gap-1">
                <p className="mr-2 text-sm text-muted-foreground">
                  {u.routineCount} routine{u.routineCount === 1 ? "" : "s"}
                </p>
                <Button variant="ghost" size="icon-xs" asChild>
                  <Link href={`/admin/users/${u.id}`} aria-label={`View ${u.email}'s report`}>
                    <ChartNoAxesColumn className="size-3.5" />
                  </Link>
                </Button>
                <EditUserDialog user={u} isSelf={u.id === currentAdminId} />
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
