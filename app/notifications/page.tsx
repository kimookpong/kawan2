import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import {
  hrefForNotification,
  iconForNotification,
  messageForNotification,
} from "@/lib/notifications";

export const metadata = {
  title: "การแจ้งเตือน",
  robots: { index: false, follow: false },
};

type ActorLite = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

async function markAllRead() {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/notifications");
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

async function markReadAndGo(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = Number(formData.get("id"));
  const to = String(formData.get("to") || "/notifications");
  if (user && id) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id);
  }
  revalidatePath("/", "layout");
  redirect(to);
}

export default async function NotificationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/notifications");

  const { data: notifs } = await supabase
    .from("notifications")
    .select("id, type, payload, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const actorIds = Array.from(
    new Set(
      (notifs ?? [])
        .map((n: any) => n.payload?.by)
        .filter((v): v is string => typeof v === "string"),
    ),
  );

  const { data: actors } = actorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, role")
        .in("id", actorIds)
    : { data: [] as ActorLite[] };

  const actorById = new Map<string, ActorLite>(
    (actors ?? []).map((a: any) => [a.id, a as ActorLite]),
  );

  const unreadCount = (notifs ?? []).filter((n: any) => !n.is_read).length;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary sm:text-2xl">
          การแจ้งเตือน
        </h1>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <button className="btn-outline gap-1 text-sm">
              <CheckCheck className="h-4 w-4" /> อ่านทั้งหมด
            </button>
          </form>
        )}
      </div>

      <div className="card divide-y divide-outline-variant">
        {(notifs ?? []).map((n: any) => {
          const actor = n.payload?.by ? actorById.get(n.payload.by) : null;
          const actorName =
            actor?.display_name || actor?.username || "ผู้ใช้";
          const href = hrefForNotification(n, actor?.username);
          return (
            <form
              key={n.id}
              action={markReadAndGo}
              className={n.is_read ? "" : "bg-primary-container/5"}
            >
              <input type="hidden" name="id" value={n.id} />
              <input type="hidden" name="to" value={href} />
              <button
                type="submit"
                className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-surface-container-low"
              >
                {actor ? (
                  <Avatar
                    src={actor.avatar_url}
                    name={actor.display_name || actor.username}
                    role={actor.role}
                    size={36}
                  />
                ) : (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-container">
                    {iconForNotification(n.type)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm text-on-surface">
                    {actor && iconForNotification(n.type)}
                    <span>{messageForNotification(n, actorName)}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {new Date(n.created_at).toLocaleString("th-TH")}
                  </p>
                </div>
                {!n.is_read && (
                  <span
                    aria-label="ยังไม่อ่าน"
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                  />
                )}
              </button>
            </form>
          );
        })}
        {(!notifs || notifs.length === 0) && (
          <p className="p-6 text-center text-sm text-on-surface-variant">
            ยังไม่มีการแจ้งเตือน
          </p>
        )}
      </div>
    </div>
  );
}
