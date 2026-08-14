import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
  ];

  // Public profile pages — only profiles with at least one public answer are
  // worth indexing. Failures (e.g. DB unavailable) fall back to static routes.
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("username, updated_at")
      .gt("public_answers_count", 0)
      .order("updated_at", { ascending: false })
      .limit(1000);

    const profileRoutes: MetadataRoute.Sitemap = (data ?? []).map((p: any) => ({
      url: `${siteUrl}/u/${p.username}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...profileRoutes];
  } catch {
    return staticRoutes;
  }
}