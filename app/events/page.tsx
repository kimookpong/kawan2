import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 120;

export default async function EventsPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, location, cover_url, starts_at, provinces(name_th)")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(30);

  return (
    <div className="w-full space-y-6">
      <h1 className="text-xl font-bold text-primary sm:text-2xl">ปฏิทินกิจกรรม</h1>

      {events && events.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e: any) => {
            const d = new Date(e.starts_at);
            return (
              <div key={e.id} className="card overflow-hidden">
                {e.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.cover_url} alt="" className="h-40 w-full object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="chip bg-primary text-on-primary">
                      {d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {e.provinces && (
                      <span className="chip bg-tertiary-container/10 text-tertiary-container">{e.provinces.name_th}</span>
                    )}
                  </div>
                  <h2 className="mt-2 font-semibold text-on-surface">{e.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{e.description}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-on-surface-variant">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {e.location}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-16 text-center text-on-surface-variant">
          ยังไม่มีกิจกรรมที่กำลังจะถึง
        </p>
      )}
    </div>
  );
}
