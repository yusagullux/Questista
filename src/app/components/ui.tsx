import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 group", className)}>
      <span
        className="grid place-items-center h-8 w-8 rounded-[10px] text-white font-bold shadow-sm transition-transform group-hover:-rotate-6"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
      >
        Q
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">Questista</span>
    </Link>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border bg-surface shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
} & (
  | (React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" })
  | (React.AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a"; href: string })
);

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-sm)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-5 py-3",
  };
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover",
    secondary: "bg-surface-2 text-foreground hover:bg-border border",
    ghost: "text-muted hover:text-foreground hover:bg-surface-2",
    danger: "bg-danger text-white hover:brightness-95",
  };
  const cls = cn(base, sizes[size], variants[variant], className);

  if ("as" in rest && rest.as === "a") {
    const { as: _as, ...anchor } = rest;
    return (
      <a className={cls} {...(anchor as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  const { as: _as, ...button } = rest as any;
  return (
    <button className={cls} {...button}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
  title,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "accent" | "success";
  className?: string;
  title?: string;
}) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
      title={title}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const init = name
    ? name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?"
    : "?";
  return (
    <span
      className={cn("inline-grid place-items-center rounded-full overflow-hidden bg-surface-2 text-muted font-semibold select-none", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? "avatar"} className="h-full w-full object-cover" />
      ) : (
        init
      )}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block animate-spin rounded-full border-2 border-primary/30 border-t-primary", className)}
      style={{ width: 18, height: 18 }}
      aria-hidden
    />
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-up">
      <div className="mb-4 text-4xl opacity-80">{icon ?? "✦"}</div>
      <h3 className="font-display text-xl font-semibold mb-1">{title}</h3>
      {children && <p className="text-muted max-w-sm">{children}</p>}
    </div>
  );
}

export function LevelBadge({ level, points }: { level: string; points: number }) {
  return (
    <Badge tone="accent" className="capitalize">
      <span aria-hidden>◆</span> {level} · {points} pts
    </Badge>
  );
}