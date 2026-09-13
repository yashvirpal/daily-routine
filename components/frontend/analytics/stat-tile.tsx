import { Card } from "@/components/ui/card";

export function StatTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}
