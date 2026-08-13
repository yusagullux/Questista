"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "./ui";
import { HistoryList } from "./history-list";

type Filter = "all" | "public" | "private" | "skipped";

export function CalendarFilter({ items }: { items: any[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      if (filter !== "all" && a.visibility !== filter) return false;
      if (!q) return true;
      const hay = `${a.question.prompt} ${a.content ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, filter]);

  const filters: Filter[] = ["all", "public", "private", "skipped"];

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your answers…"
          className="flex-1 rounded-[var(--radius-sm)] border bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-primary/60"
        />
        <div className="flex gap-1 p-1 rounded-[var(--radius-sm)] bg-surface-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "px-3 py-1.5 rounded-[6px] text-sm capitalize transition-colors " +
                (filter === f ? "bg-surface shadow-sm font-medium" : "text-muted hover:text-foreground")
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing matches" icon="🔍">
          Try a different search or filter.
        </EmptyState>
      ) : (
        <HistoryList items={filtered} />
      )}
    </div>
  );
}