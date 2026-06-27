import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kawan2.app";

export const revalidate = 3600; // อัปเดต sitemap ทุกชั่วโมง

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const [
    { data: news },
    { data: threads },
    { data: guilds },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from("news")
      .select("slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(2000),
    supabase
      .from("threads")
      .select("id, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.from("guilds").select("slug, created_at").limit(2000),
    supabase.from("categories").select("slug").eq("is_active", true),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/news",
    "/board",
    "/events",
    "/guilds",
    "/members",
    "/marketplace",
    "/membership",
    "/guidelines",
    "/contact",
  ].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const newsRoutes: MetadataRoute.Sitemap = (news ?? []).map((n: any) => ({
    url: `${SITE}/news/${n.slug}`,
    lastModified: n.published_at ? new Date(n.published_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const threadRoutes: MetadataRoute.Sitemap = (threads ?? []).map((t: any) => ({
    url: `${SITE}/board/thread/${t.id}`,
    lastModified: t.created_at ? new Date(t.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map(
    (c: any) => ({
      url: `${SITE}/board/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    }),
  );

  const guildRoutes: MetadataRoute.Sitemap = (guilds ?? []).map((g: any) => ({
    url: `${SITE}/guilds/${g.slug}`,
    lastModified: g.created_at ? new Date(g.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...newsRoutes,
    ...categoryRoutes,
    ...threadRoutes,
    ...guildRoutes,
  ];
}
