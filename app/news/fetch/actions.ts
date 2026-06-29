"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FirecrawlApp from "@mendable/firecrawl-js";

function createSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  const rand = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${rand}` : `news-${rand}`;
}

async function requireEditor() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "editor" && profile?.role !== "admin") throw new Error("Forbidden");
  return { supabase, user, role: profile.role as string };
}

export async function searchNews(formData: FormData) {
  await requireEditor();
  const keyword = formData.get("keyword") as string;
  const domain = formData.get("domain") as string;
  const timeFrame = formData.get("timeFrame") as string;

  if (!keyword) return { error: "กรุณาระบุคำค้นหา (keyword)", results: [] };

  let query = keyword;
  if (domain && domain !== "all") {
    query = `${keyword} site:${domain}`;
  }

  const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  try {
    const searchParams: any = { timeout: 12000, limit: 10 };
    if (timeFrame) {
      searchParams.tbs = timeFrame;
    }
    const searchResults = await app.search(query, searchParams) as any;
    
    if (searchResults.success === false) {
      return { error: searchResults.error || "Failed to search", results: [] };
    }
    
    // Do NOT access searchResults.data as the SDK throws an error if we try to read it.
    const results = searchResults.web || [];
    return { results };
  } catch (error: any) {
    console.error(error);
    return { error: error.message || "Failed to search", results: [] };
  }
}

export async function processNewsFromUrl(prevState: any, formData: FormData) {
  const { supabase, user } = await requireEditor();
  const url = formData.get("url") as string;
  const fallbackTitle = formData.get("title") as string;
  const fallbackDescription = formData.get("description") as string;
  const actionType = formData.get("actionType") as "preview" | "draft" | "publish" || "draft";
  
  if (!url) return { error: "URL is required" };

  let title = fallbackTitle || "Untitled News";
  let excerpt = fallbackDescription || null;
  let body = "";
  let cover_url = null;
  let socialTag = "";

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch) {
      socialTag = `[youtube]${ytMatch[1]}[/youtube]\n\n`;
      cover_url = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }
  } else if (url.includes("tiktok.com")) {
    socialTag = `[tiktok]${url}[/tiktok]\n\n`;
  } else if (url.includes("facebook.com") || url.includes("fb.watch")) {
    if (url.includes("/videos/") || url.includes("watch")) {
      socialTag = `[fbvideo]${url}[/fbvideo]\n\n`;
    } else {
      socialTag = `[fbpost]${url}[/fbpost]\n\n`;
    }
  }

  const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  try {
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ['markdown']
    }) as any;
    
    if (scrapeResult.success !== false) {
      title = scrapeResult.metadata?.title || title;
      excerpt = scrapeResult.metadata?.description || excerpt;
      cover_url = scrapeResult.metadata?.ogImage || scrapeResult.metadata?.image || cover_url;
      if (scrapeResult.markdown) {
        body = scrapeResult.markdown;
      }
    } else {
      console.warn("Firecrawl scrape returned success=false", scrapeResult.error);
    }
  } catch (error: any) {
    console.warn("Firecrawl scrape failed, using fallback.", error.message);
  }

  if (!body) {
    body = fallbackDescription ? `[b]${fallbackDescription}[/b]` : "";
  }

  if (!cover_url && body) {
    const imgMatch = body.match(/!\[.*?\]\((.*?)\)/);
    if (imgMatch) {
      cover_url = imgMatch[1];
    }
  }

  body = `${socialTag}${body}\n\n[b]ที่มา:[/b] [url=${url}]คลิกเพื่ออ่านข่าวต้นฉบับ[/url]`;

  if (actionType === "preview") {
    return {
      previewData: { title, excerpt, cover_url, body }
    };
  }

  const slug = createSlug(title);

  const { data, error } = await supabase
    .from("news")
    .insert({
      slug,
      title,
      excerpt,
      body,
      cover_url,
      author_id: user.id,
      status: actionType === "publish" ? "published" : "draft",
    })
    .select("slug")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/news");
  if (actionType === "publish") {
    redirect(`/news/${data!.slug}`);
  } else {
    redirect(`/news/${data!.slug}/edit`);
  }
}
