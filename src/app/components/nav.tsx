"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo, Button, Avatar, IconButton } from "./ui";
import {
  MenuIcon,
  CloseIcon,
  ChevronDownIcon,
  UserIcon,
  SettingsIcon,
  LogoutIcon,
  CalendarIcon,
  SparkIcon,
} from "./icons";
import { cn, almanacDate, editionNumber } from "@/lib/utils";

type NavUser = {
  id: string;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  is_admin: boolean;
};

const LINKS = [
  { href: "/", label: "Today", icon: SparkIcon, exact: true },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon, auth: true },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [user, setUser] = useState<NavUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Dated masthead string — computed once via a useState initializer. This
  // runs during the server render and its value is reused on hydration, so
  // there is no hydration mismatch (the client never re-runs the initializer)
  // and no setState-in-effect. Timezone is pinned to Tallinn; server-time is
  // the correct "edition" date for a daily product.
  const [dateline] = useState<string>(
    () => `${almanacDate(new Date())} · NO. ${editionNumber(new Date())}`,
  );

  // Mobile menu closes on link click (see onClick handlers below), and the
  // user dropdown closes on outside-click/Esc — no setState-in-effect needed.
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadProfile(uid: string) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url, display_name, is_admin")
        .eq("id", uid)
        .single();
      return profile as
        | { username: string; avatar_url: string | null; display_name: string | null; is_admin: boolean }
        | null;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (!data.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      const p = await loadProfile(data.user.id);
      if (!active) return;
      setUser({ id: data.user.id, ...(p ?? { username: "you", avatar_url: null, display_name: null, is_admin: false }) });
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      const p = await loadProfile(session.user.id);
      setUser({ id: session.user.id, ...(p ?? { username: "you", avatar_url: null, display_name: null, is_admin: false }) });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const allLinks = [
    ...LINKS,
    ...(user
      ? [{ href: `/u/${user.username}`, label: "Profile", icon: UserIcon, auth: true } as const]
      : []),
    ...(user?.is_admin
      ? [{ href: "/admin", label: "Admin", icon: SettingsIcon, auth: true } as const]
      : []),
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <nav className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between gap-2">
        <Logo />

        {/* Desktop links — active shown with a stamp-red underline rule */}
        <div className="hidden sm:flex items-center gap-1">
          {allLinks.map((l) => {
            const Icon = l.icon;
            const active = isActive(l.href, "exact" in l && l.exact);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 text-sm px-3 py-2 transition-colors relative",
                  active
                    ? "text-foreground font-medium"
                    : "text-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {l.label}
                {active && (
                  <span
                    className="absolute left-3 right-3 -bottom-px h-0.5 bg-primary"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <span className="masthead hidden md:inline mr-1" aria-hidden>
            {dateline}
          </span>
          {loading ? (
            <span className="w-8" aria-hidden />
          ) : user ? (
            <UserMenu
              user={user}
              open={menuOpen}
              setOpen={setMenuOpen}
              onProfile={() => setMenuOpen(false)}
            />
          ) : (
            <div className="flex items-center gap-1">
              <Link
                href="/login"
                className="text-sm text-muted hover:text-foreground px-3 py-2 transition-colors"
              >
                Log in
              </Link>
              <Button as="a" href="/signup" size="sm">
                Join
              </Button>
            </div>
          )}

          {/* Mobile toggle */}
          <IconButton
            label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
            className="sm:hidden"
          >
            {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </IconButton>
        </div>
      </nav>

      {/* Mobile panel — hairline, masthead date at the top */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-background animate-fade-up">
          <div className="mx-auto max-w-2xl px-4 pt-3">
            <span className="masthead" aria-hidden>
              {dateline}
            </span>
          </div>
          <div className="mx-auto max-w-2xl px-4 py-3 flex flex-col gap-1">
            {allLinks.map((l) => {
              const Icon = l.icon;
              const active = isActive(l.href, "exact" in l && l.exact);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-[var(--radius-sm)] transition-colors",
                    active
                      ? "text-foreground bg-surface-2 font-medium"
                      : "text-muted hover:text-foreground hover:bg-surface-2/60",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
            {!user && (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-[var(--radius-sm)] text-muted hover:text-foreground hover:bg-surface-2/60"
              >
                <UserIcon className="h-4 w-4" />
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function UserMenu({
  user,
  open,
  setOpen,
  onProfile,
}: {
  user: NavUser;
  open: boolean;
  setOpen: (v: boolean) => void;
  onProfile: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar
          name={user.display_name ?? user.username}
          src={user.avatar_url}
          size={32}
        />
        <ChevronDownIcon
          className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-[var(--radius)] border border-border bg-surface shadow-md py-1.5 animate-fade-up"
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium truncate">
              {user.display_name ?? user.username}
            </p>
            <p className="text-xs text-subtle truncate">@{user.username}</p>
          </div>
          <MenuLink href={`/u/${user.username}`} onClick={onProfile} icon={UserIcon}>
            Your profile
          </MenuLink>
          <MenuLink href="/settings" onClick={onProfile} icon={SettingsIcon}>
            Settings
          </MenuLink>
          {user.is_admin && (
            <MenuLink href="/admin" onClick={onProfile} icon={SparkIcon}>
              Admin
            </MenuLink>
          )}
          <div className="my-1 border-t border-border" />
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted hover:text-danger hover:bg-danger-soft transition-colors"
            >
              <LogoutIcon className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: (p: { className?: string }) => React.ReactElement;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}