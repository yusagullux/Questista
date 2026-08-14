"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/* Lightweight, dependency-free toasts: dispatch a CustomEvent; <Toaster/> renders. */

type ToastTone = "default" | "success" | "danger";
type Toast = { id: number; message: string; tone: ToastTone; ms: number };

let _id = 0;
export function toast(message: string, tone: ToastTone = "default", ms = 3200) {
  if (typeof window === "undefined") return;
  const id = ++_id;
  window.dispatchEvent(
    new CustomEvent<Toast>("questista:toast", { detail: { id, message, tone, ms } }),
  );
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    function onToast(e: Event) {
      const t = (e as CustomEvent<Toast>).detail;
      setItems((prev) => [...prev, t]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, t.ms);
    }
    window.addEventListener("questista:toast", onToast as EventListener);
    return () => window.removeEventListener("questista:toast", onToast as EventListener);
  }, []);

  const tones = {
    default: "bg-surface text-foreground border-border",
    success: "bg-surface text-foreground border-success/40",
    danger: "bg-surface text-foreground border-danger/40",
  };
  const dot: Record<ToastTone, string> = {
    default: "bg-muted",
    success: "bg-success",
    danger: "bg-danger",
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-center gap-3 rounded-[var(--radius-sm)] border shadow-md px-4 py-3 text-sm animate-fade-up",
            tones[t.tone],
          )}
        >
          <span className={cn("h-2 w-2 rounded-full shrink-0", dot[t.tone])} aria-hidden />
          <span className="min-w-0">{t.message}</span>
        </div>
      ))}
    </div>
  );
}