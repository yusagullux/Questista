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
      <div className="rule-label mb-4">
        <span>{filtered.length} entr{filtered.length === 1 ? "y" : "ies"}</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your answers…"
          className="flex-1 field-input px-4 py-2.5 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={
                "stamp text-[0.625rem] capitalize transition-colors " +
                (filter === f ? "stamp--filled" : "stamp--ghost hover:border-border-strong")
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