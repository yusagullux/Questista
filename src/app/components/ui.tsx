import Link from "next/link";
import { cn } from "@/lib/utils";

/* ───────────────────────────── Logo ───────────────────────────── */

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 group", className)}
      aria-label="Questista — home"
    >
      <span
        className="grid place-items-center h-8 w-8 rounded-[10px] text-white font-bold shadow-sm transition-transform duration-300 group-hover:-rotate-6"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
        aria-hidden
      >
        Q
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">Questista</span>
    </Link>
  );
}

/* ───────────────────────────── Container ───────────────────────────── */

export function Container({
  children,
  className,
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const max = { sm: "max-w-sm", md: "max-w-2xl", lg: "max-w-4xl" }[size];
  return <div className={cn("mx-auto w-full px-4", max, className)}>{children}</div>;
}

/* ───────────────────────────── Card ───────────────────────────── */

export function Card({
  className,
  children,
  interactive,
}: {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border bg-surface shadow-sm",
        interactive && "transition-shadow hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ───────────────────────────── Button ───────────────────────────── */

type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
  loading?: boolean;
} & (
  | (React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" })
  | (React.AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a"; href: string })
);

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  loading = false,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-sm)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-55 disabled:cursor-not-allowed select-none";
  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-5 py-3",
  };
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover active:brightness-95 shadow-sm",
    secondary: "bg-surface-2 text-foreground hover:bg-surface-3 border border-border",
    outline: "bg-transparent text-foreground border border-border-strong hover:bg-surface-2",
    ghost: "text-muted hover:text-foreground hover:bg-surface-2",
    danger: "bg-danger text-white hover:brightness-95 active:brightness-90 shadow-sm",
  };
  const cls = cn(base, sizes[size], variants[variant], className);

  const inner = (
    <>
      {loading && <Spinner />}
      {children}
    </>
  );

  if ("as" in rest && rest.as === "a") {
    const { as: _as, ...anchor } = rest;
    return (
      <a className={cls} {...(anchor as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {inner}
      </a>
    );
  }
  const { as: _as, ...button } = rest as any;
  return (
    <button className={cls} disabled={button.disabled || loading || undefined} {...button}>
      {inner}
    </button>
  );
}

/* ───────────────────────────── IconButton ───────────────────────────── */

export function IconButton({
  className,
  children,
  label,
  ...rest
}: {
  className?: string;
  children: React.ReactNode;
  label: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid place-items-center h-9 w-9 rounded-[var(--radius-sm)] text-muted hover:text-foreground hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────── Badge ───────────────────────────── */

export function Badge({
  children,
  tone = "neutral",
  className,
  title,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "accent" | "success" | "danger";
  className?: string;
  title?: string;
}) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
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

/* ───────────────────────────── Avatar ───────────────────────────── */

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
      className={cn(
        "inline-grid place-items-center rounded-full overflow-hidden bg-surface-2 text-muted font-semibold select-none shrink-0",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
      ) : (
        init
      )}
    </span>
  );
}

/* ───────────────────────────── Spinner ───────────────────────────── */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-primary/25 border-t-primary align-[-0.125em]",
        className,
      )}
      style={{ width: 18, height: 18 }}
      role="status"
      aria-label="Loading"
    />
  );
}

/* ───────────────────────────── EmptyState ───────────────────────────── */

export function EmptyState({
  icon,
  title,
  children,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-14 px-6 animate-fade-up",
        className,
      )}
    >
      <div className="mb-4 text-4xl opacity-80" aria-hidden>
        {icon ?? "✦"}
      </div>
      <h3 className="font-display text-xl font-semibold mb-1">{title}</h3>
      {children && <p className="text-muted max-w-sm text-sm">{children}</p>}
    </div>
  );
}

/* ───────────────────────────── LevelBadge ───────────────────────────── */

export function LevelBadge({ level, points }: { level: string; points: number }) {
  return (
    <Badge tone="accent" className="capitalize">
      <span aria-hidden>◆</span> {level} · {points} pts
    </Badge>
  );
}

/* ───────────────────────────── Skeleton ───────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

/* ───────────────────────────── Form fields ───────────────────────────── */

export function Field({
  label,
  hint,
  error,
  id,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-subtle">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  className,
  invalid,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn("field-input", invalid && "border-danger focus:border-danger", className)}
      {...rest}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(
        "field-input resize-none",
        invalid && "border-danger focus:border-danger",
        className,
      )}
      {...rest}
    />
  );
}