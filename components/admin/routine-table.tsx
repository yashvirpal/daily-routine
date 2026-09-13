import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AdminRoutineSummary } from "@/lib/types";

export function RoutineTable({
  routines,
  total,
}: {
  routines: AdminRoutineSummary[];
  total: number;
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        All routines ({total})
      </h2>
      <Card className="divide-y overflow-hidden p-0">
        {routines.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No routines match.</p>
        ) : (
          routines.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-4">
              <div>
                <p>{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.ownerEmail}</p>
              </div>
              <Badge variant={r.isActive ? "default" : "secondary"}>
                {r.isActive ? "active" : "inactive"}
              </Badge>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
