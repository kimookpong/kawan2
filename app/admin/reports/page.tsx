import Link from "next/link";
import { Flag, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveReport } from "./actions";

export const metadata = {
  title: "รายงานเนื้อหา",
  robots: { index: false, follow: false },
};

const TYPE_LABEL: Record<string, string> = {
  thread: "กระทู้",
  post: "ความเห็นในกระทู้",
  news: "ข่าว",
  news_comment: "ความเห็นข่าว",
  listing: "ประกาศ Marketplace",
  listing_comment: "ความเห็นในประกาศ",
};

export default async function AdminReportsPage() {
  const supabase = createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("id, target_type, target_id, reason, status, created_at, profiles:reporter_id(username, display_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  // ดึงหัวข้อ/ลิงก์ของเป้าหมาย เพื่อให้แอดมินดูเนื้อหาก่อนตัดสิน
  const ids = (t: string) => (reports ?? []).filter((r: any) => r.target_type === t).map((r: any) => r.target_id);
  const [{ data: threads }, { data: news }, { data: listings }, { data: listingComments }] = await Promise.all([
    ids("thread").length
      ? supabase.from("threads").select("id, title").in("id", ids("thread"))
      : Promise.resolve({ data: [] as any[] }),
    ids("news").length
      ? supabase.from("news").select("id, title, slug").in("id", ids("news"))
      : Promise.resolve({ data: [] as any[] }),
    ids("listing").length
      ? supabase.from("marketplace_listings").select("id, title").in("id", ids("listing"))
      : Promise.resolve({ data: [] as any[] }),
    ids("listing_comment").length
      ? supabase.from("listing_comments").select("id, listing_id").in("id", ids("listing_comment"))
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const threadMap = new Map((threads ?? []).map((t: any) => [t.id, t]));
  const newsMap = new Map((news ?? []).map((n: any) => [n.id, n]));
  const listingMap = new Map((listings ?? []).map((l: any) => [l.id, l]));
  const listingCommentMap = new Map((listingComments ?? []).map((c: any) => [c.id, c]));

  function targetInfo(r: any): { title: string; href: string | null } {
    if (r.target_type === "thread")
      return { title: threadMap.get(r.target_id)?.title ?? `กระทู้ #${r.target_id}`, href: `/board/thread/${r.target_id}` };
    if (r.target_type === "post")
      return { title: `ความเห็น #${r.target_id}`, href: null };
    if (r.target_type === "news") {
      const n = newsMap.get(r.target_id);
      return { title: n?.title ?? `ข่าว #${r.target_id}`, href: n?.slug ? `/news/${n.slug}` : null };
    }
    if (r.target_type === "listing") {
      const l = listingMap.get(r.target_id);
      return { title: l?.title ?? `ประกาศ #${r.target_id}`, href: `/marketplace/listing/${r.target_id}` };
    }
    if (r.target_type === "listing_comment") {
      const c = listingCommentMap.get(r.target_id);
      return {
        title: `ความเห็น #${r.target_id}`,
        href: c?.listing_id ? `/marketplace/listing/${c.listing_id}#comment-${r.target_id}` : null,
      };
    }
    return { title: `${TYPE_LABEL[r.target_type] ?? r.target_type} #${r.target_id}`, href: null };
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-error" />
        <h1 className="text-xl font-bold text-on-surface">รายงานเนื้อหา ({reports?.length ?? 0})</h1>
      </div>

      <div className="space-y-3">
        {(reports ?? []).map((r: any) => {
          const info = targetInfo(r);
          const reporter = r.profiles?.display_name || r.profiles?.username || "ไม่ทราบ";
          return (
            <div key={r.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                <span className="chip bg-error-container text-on-error-container">{TYPE_LABEL[r.target_type] ?? r.target_type}</span>
                <span>รายงานโดย {reporter}</span>
                <span>· {new Date(r.created_at).toLocaleString("th-TH")}</span>
              </div>

              <p className="mt-2 font-semibold text-on-surface">
                {info.href ? (
                  <Link href={info.href} target="_blank" className="hover:text-primary hover:underline">
                    {info.title}
                  </Link>
                ) : (
                  info.title
                )}
              </p>

              {r.reason && (
                <p className="mt-1 rounded-lg bg-surface-container-low p-2 text-sm text-on-surface-variant">
                  เหตุผล: {r.reason}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2">
                <form action={resolveReport}>
                  <input type="hidden" name="report_id" value={r.id} />
                  <input type="hidden" name="delete" value="1" />
                  <button className="inline-flex items-center gap-1 rounded-lg bg-error px-3 py-1.5 text-xs font-bold text-on-error transition hover:opacity-90">
                    <Trash2 className="h-3.5 w-3.5" /> ยืนยันลบถาวร
                  </button>
                </form>
                <form action={resolveReport}>
                  <input type="hidden" name="report_id" value={r.id} />
                  <input type="hidden" name="delete" value="0" />
                  <button className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface-variant transition hover:bg-surface-container-low">
                    <X className="h-3.5 w-3.5" /> ยกเลิก (ไม่ลบ)
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {(!reports || reports.length === 0) && (
          <p className="card p-8 text-center text-sm text-on-surface-variant">ไม่มีรายงานที่รอการตรวจสอบ</p>
        )}
      </div>
    </div>
  );
}
