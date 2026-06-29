import { redirect } from "next/navigation";
import { AlertCircle, Search, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { searchNews } from "./actions";
import { KeywordInput } from "@/components/news/keyword-input";
import { ResultActions } from "@/components/news/result-actions";

export const metadata = {
  title: "ดึงข่าวออนไลน์",
  robots: { index: false, follow: false },
};

export default async function FetchNewsPage({
  searchParams,
}: {
  searchParams: { keyword?: string; domain?: string; timeFrame?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/news/fetch");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "editor" && profile?.role !== "admin") redirect("/news");

  let searchResults = [];
  let errorMsg = "";

  if (searchParams.keyword) {
    const fd = new FormData();
    fd.append("keyword", searchParams.keyword);
    if (searchParams.domain) {
      fd.append("domain", searchParams.domain);
    }
    if (searchParams.timeFrame) {
      fd.append("timeFrame", searchParams.timeFrame);
    }
    
    const { results, error } = await searchNews(fd);
    if (error) errorMsg = error;
    if (results) searchResults = results;
  }

  return (
    <div className="w-full space-y-6">
      <h1 className="text-xl font-bold text-primary sm:text-2xl">ดึงข่าวออนไลน์ผ่าน Firecrawl</h1>
      
      <form className="card space-y-4 p-6" action="/news/fetch" method="GET">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-3 lg:col-span-1">
            <span className="mb-1 block text-sm font-medium">คำค้นหา (Keyword)</span>
            <KeywordInput defaultValue={searchParams.keyword} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">แหล่งข่าว (Domain)</span>
            <select 
              name="domain" 
              defaultValue={searchParams.domain || "all"} 
              className="w-full rounded border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">— ทุกแหล่งข่าว —</option>
              <option value="thairath.co.th">thairath.co.th (ไทยรัฐ)</option>
              <option value="matichon.co.th">matichon.co.th (มติชน)</option>
              <option value="khaosod.co.th">khaosod.co.th (ข่าวสด)</option>
              <option value="mgronline.com">mgronline.com (ผู้จัดการ)</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">ระยะเวลา (Time)</span>
            <select 
              name="timeFrame" 
              defaultValue={searchParams.timeFrame || "qdr:w"} 
              className="w-full rounded border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">— ทุกช่วงเวลา —</option>
              <option value="qdr:d">24 ชั่วโมงที่ผ่านมา</option>
              <option value="qdr:w">7 วันที่ผ่านมา (ค่าเริ่มต้น)</option>
              <option value="qdr:m">1 เดือนที่ผ่านมา</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary inline-flex items-center gap-2">
            <Search className="h-4 w-4" /> ค้นหาข่าว
          </button>
        </div>
      </form>

      {errorMsg && (
        <p className="flex items-center gap-2 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          <AlertCircle className="h-4 w-4" /> {errorMsg}
        </p>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">ผลการค้นหา</h2>
          <div className="grid gap-4">
            {searchResults.map((res: any, idx: number) => (
              <div key={idx} className="card p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold">{res.title}</h3>
                  <p className="text-sm text-on-surface-variant line-clamp-2">{res.description}</p>
                  <a href={res.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> เปิดดูต้นฉบับ
                  </a>
                </div>
                <div className="flex items-center shrink-0">
                  <ResultActions url={res.url} title={res.title} description={res.description} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {searchParams.keyword && searchResults.length === 0 && !errorMsg && (
        <p className="text-sm text-on-surface-variant">ไม่พบผลการค้นหาสำหรับ "{searchParams.keyword}"</p>
      )}
    </div>
  );
}
