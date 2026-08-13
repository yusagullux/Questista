"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo, Button, Avatar } from "./ui";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; username: string; avatar_url: string | null; display_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (!data.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url, display_name")
        .eq("id", data.user.id)
        .single();
      if (!active) return;
      setUser({ id: data.user.id, ...(profile as any) });
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url, display_name")
        .eq("id", session.user.id)
        .single();
      setUser({ id: session.user.id, ...(profile as any) });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [pathname]);

  const link = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={cn(
          "text-sm px-3 py-2 rounded-[var(--radius-sm)] transition-colors",
          active ? "text-foreground bg-surface-2 font-medium" : "text-muted hover:text-foreground",
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b">
      <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-1">
          {link("/", "Today")}
          {user && link("/calendar", "Calendar")}
          {user && link(`/u/${user.username}`, "Profile")}
        </nav>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="w-9" />
          ) : user ? (
            <form action="/api/auth/signout" method="post">
              <button className="flex items-center gap-2 group" title="Sign out" aria-label="Sign out">
                <Avatar name={user.display_name ?? user.username} src={user.avatar_url} size={32} className="ring-1 ring-border group-hover:ring-primary/40 transition" />
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted hover:text-foreground px-3 py-2">
                Log in
              </Link>
              <Button as="a" href="/signup" size="sm">
                Join
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}