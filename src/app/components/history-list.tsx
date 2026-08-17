import { Badge, Card } from "./ui";
import { almanacDate } from "@/lib/utils";

export function HistoryList({ items }: { items: any[] }) {
  return (
    <div className="space-y-3">
      {items.map((a) => {
        const vis = a.visibility;
        const tone = vis === "public" ? "slate" : vis === "private" ? "slate" : "neutral";
        const dateLabel = almanacDate(a.question.scheduled_date ?? a.created_at)
          .split(" ")
          .slice(0, 2)
          .join(" ");
        return (
          <Card key={a.id} className="p-4 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <span className="stamp stamp--ghost">{dateLabel}</span>
              <Badge tone={tone as any} className="capitalize">
                {vis}
              </Badge>
            </div>
            <p className="font-display font-medium text-sm text-muted mb-2 leading-snug">
              {a.question.prompt}
            </p>
            {a.content ? (
              <p className="prose-entry whitespace-pre-wrap text-foreground border-t border-border pt-2.5">
                {a.content}
              </p>
            ) : (
              <p className="text-sm text-subtle italic">Skipped</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}