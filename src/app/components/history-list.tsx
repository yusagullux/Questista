import { Badge, Card } from "./ui";
import { shortDate } from "@/lib/utils";

export function HistoryList({ items }: { items: any[] }) {
  return (
    <div className="space-y-3">
      {items.map((a) => {
        const vis = a.visibility;
        const tone = vis === "public" ? "success" : "neutral";
        const icon = vis === "public" ? "🌎" : vis === "private" ? "🔒" : "—";
        return (
          <Card key={a.id} className="p-4 animate-fade-up">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-subtle">
                {shortDate(a.question.scheduled_date ?? a.created_at)}
              </span>
              <Badge tone={tone as any}>
                {icon} {vis}
              </Badge>
            </div>
            <p className="font-display font-medium text-sm text-muted mb-2">
              {a.question.prompt}
            </p>
            {a.content ? (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{a.content}</p>
            ) : (
              <p className="text-sm text-subtle italic">Skipped</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}