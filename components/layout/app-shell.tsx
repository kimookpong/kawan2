"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  hrefForNotification,
  iconForNotification,
  messageForNotification,
  type NotifLite,
} from "@/lib/notifications";
import {
  Menu,
  X,
  Home,
  Newspaper,
  MessagesSquare,
  CalendarDays,
  Swords,
  Users,
  ShoppingBag,
  MessageCircle,
  Bell,
  Shield,
  LogOut,
  Plus,
  Search,
  Crown,
  UserRound,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { LevelBadge } from "@/components/user-badges";
import { signout } from "@/app/auth/actions";

type ProfileLite = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level_id: number;
  reputation: number;
  role?: string;
  membership_tier?: string;
  banned_until?: string | null;
  disabled?: boolean;
} | null;

const NAV = [
  { href: "/", label: "หน้าแรก", Icon: Home },
  { href: "/news", label: "ข่าวสาร", Icon: Newspaper },
  { href: "/board", label: "กระดานสนทนา", Icon: MessagesSquare },
  { href: "/events", label: "ปฏิทินกิจกรรม", Icon: CalendarDays },
  { href: "/marketplace", label: "ตลาดซื้อขาย", Icon: ShoppingBag },
  { href: "/guilds", label: "กิลด์", Icon: Swords },
  { href: "/members", label: "ค้นหาสมาชิก", Icon: Users },
];

export function AppShell({
  user,
  profile,
  unreadNotifs = 0,
  children,
}: {
  user: User | null;
  profile: ProfileLite;
  unreadNotifs?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<NotifLite[]>([]);
  const [unreadLocal, setUnreadLocal] = useState(unreadNotifs);
  const pathname = usePathname();
  const router = useRouter();

  // sync เมื่อ server prop เปลี่ยน (เช่นหลัง navigation/revalidate)
  useEffect(() => {
    setUnreadLocal(unreadNotifs);
  }, [unreadNotifs]);

  // realtime: subscribe notifications ของตัวเอง → toast + bump badge
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notif-toast-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as NotifLite;
          setUnreadLocal((c) => c + 1);
          setToasts((q) => [...q, n]);
          window.setTimeout(() => {
            setToasts((q) => q.filter((t) => t.id !== n.id));
          }, 6000);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="space-y-1">
      {NAV.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClick}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            isActive(href)
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </Link>
      ))}
      {profile?.role === "admin" && (
        <Link
          href="/admin"
          onClick={onClick}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            isActive("/admin")
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
          }`}
        >
          <Shield className="h-5 w-5 shrink-0" /> แผงผู้ดูแล
        </Link>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* ===== Top bar ===== */}
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-container w-full items-center gap-1 p-2">
          {/* hamburger (mobile) */}
          <button
            onClick={() => setOpen(true)}
            className="rounded p-2 text-on-surface-variant hover:bg-surface-container lg:hidden"
            aria-label="เปิดเมนู"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* logo */}
          <Link href="/" className="flex items-center" aria-label="Kawan2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/image2.png" alt="Kawan2" className="h-6 w-auto" />
          </Link>

          {/* search (desktop) */}
          <form
            action="/search"
            method="get"
            className="relative ml-4 hidden max-w-md flex-1 md:block"
          >
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
            <input
              type="search"
              name="q"
              placeholder="ค้นหากระทู้ ข่าว หรือสมาชิก..."
              className="w-full rounded-full border border-outline-variant bg-surface-container-low py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </form>

          <div className="ml-auto flex items-center gap-1 pr-2">
            {user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="relative flex rounded-full ring-2 ring-transparent transition hover:ring-outline-variant"
                  aria-label="เมนูผู้ใช้"
                  aria-expanded={menuOpen}
                >
                  <Avatar
                    src={profile.avatar_url}
                    name={profile.display_name || profile.username}
                    role={profile.role}
                    size={36}
                  />
                  {unreadLocal > 0 && (
                    <span
                      aria-label={`มี ${unreadLocal} การแจ้งเตือนใหม่`}
                      className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-on-error ring-2 ring-surface-container-lowest"
                    >
                      {unreadLocal > 9 ? "9+" : unreadLocal}
                    </span>
                  )}
                </button>

                {menuOpen && (
                  <>
                    {/* backdrop ปิดเมนูเมื่อคลิกข้างนอก */}
                    <button
                      aria-hidden
                      onClick={() => setMenuOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-card">
                      {/* ข้อมูลผู้ใช้ */}
                      <Link
                        href={`/u/${profile.username}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 border-b border-outline-variant p-3 hover:bg-surface-container-low"
                      >
                        <Avatar
                          src={profile.avatar_url}
                          name={profile.display_name || profile.username}
                          role={profile.role}
                          size={44}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-on-surface">
                            {profile.display_name || profile.username}
                          </p>
                          <p className="truncate text-xs text-on-surface-variant">
                            @{profile.username}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <LevelBadge levelId={profile.level_id} />
                            <span className="text-[11px] text-on-surface-variant">
                              {(profile.reputation ?? 0).toLocaleString(
                                "th-TH",
                              )}{" "}
                              คะแนน
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* เมนู */}
                      <nav className="py-1 text-sm">
                        {[
                          {
                            href: `/u/${profile.username}`,
                            Icon: UserRound,
                            label: "โปรไฟล์ของฉัน",
                          },
                          {
                            href: "/messages",
                            Icon: MessageCircle,
                            label: "ข้อความ",
                          },
                          {
                            href: "/notifications",
                            Icon: Bell,
                            label: "การแจ้งเตือน",
                          },
                          ...(profile.role === "admin"
                            ? [
                                {
                                  href: "/admin",
                                  Icon: Shield,
                                  label: "แผงผู้ดูแล",
                                },
                              ]
                            : []),
                          {
                            href: "/membership",
                            Icon: Crown,
                            label: "สนับสนุนเรา",
                          },
                        ].map(({ href, Icon, label }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-on-surface hover:bg-surface-container-low"
                          >
                            <Icon className="h-4 w-4 text-on-surface-variant" />{" "}
                            <span className="flex-1">{label}</span>
                            {href === "/notifications" && unreadLocal > 0 && (
                              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-error px-1.5 text-[11px] font-bold text-on-error">
                                {unreadLocal > 9 ? "9+" : unreadLocal}
                              </span>
                            )}
                          </Link>
                        ))}
                      </nav>

                      <form
                        action={signout}
                        className="border-t border-outline-variant"
                      >
                        <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-error hover:bg-error-container">
                          <LogOut className="h-4 w-4" /> ออกจากระบบ
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="btn-outline">
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* แบนเนอร์เมื่อถูกระงับ/ปิดบัญชี */}
      {profile &&
        (profile.disabled ||
          (profile.banned_until &&
            new Date(profile.banned_until).getTime() > Date.now())) && (
          <div className="bg-error px-4 py-2 text-center text-sm font-medium text-on-error">
            {profile.disabled
              ? "บัญชีของคุณถูกปิดใช้งาน — โพสต์/ตอบ/ส่งข้อความไม่ได้"
              : `บัญชีของคุณถูกระงับถึง ${new Date(profile.banned_until!).toLocaleString("th-TH")} — โพสต์/ตอบ/ส่งข้อความไม่ได้`}
          </div>
        )}

      {/* ===== body: sidebar + main ===== */}
      <div className="mx-auto flex w-full max-w-container">
        {/* desktop sidebar */}
        <aside className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-60 shrink-0 overflow-y-auto border-r border-outline-variant p-4 lg:block">
          <NavLinks />
          {user && (
            <Link
              href="/board/new"
              className="btn-accent mt-4 flex w-full items-center justify-center gap-1"
            >
              <Plus className="h-4 w-4" /> สร้างกระทู้
            </Link>
          )}
          <Link
            href="/membership"
            className="mt-2 flex w-full items-center justify-center gap-1 rounded bg-amber-400 px-4 py-2 text-sm font-bold text-[#0f1b2e] transition hover:bg-amber-300"
          >
            <Crown className="h-4 w-4" /> สนับสนุนเรา
          </Link>
        </aside>

        {/* main (ความกว้างกำหนดในแต่ละหน้า) */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* ===== mobile drawer (เลื่อนจากซ้าย) ===== */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] overflow-y-auto bg-surface-container-lowest p-2 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/image2.png" alt="Kawan2" className="h-6 w-auto" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-2 hover:bg-surface-container"
                aria-label="ปิดเมนู"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onClick={() => setOpen(false)} />
            {user && (
              <Link
                href="/board/new"
                onClick={() => setOpen(false)}
                className="btn-accent mt-4 flex w-full items-center justify-center gap-1"
              >
                <Plus className="h-4 w-4" /> สร้างกระทู้
              </Link>
            )}
            <Link
              href="/membership"
              onClick={() => setOpen(false)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded bg-amber-400 px-4 py-2 text-sm font-bold text-[#0f1b2e]"
            >
              <Crown className="h-4 w-4" /> สนับสนุนเรา
            </Link>
          </div>
        </div>
      )}

      {/* ===== Realtime notification toasts ===== */}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
          {toasts.map((t) => (
            <Link
              key={t.id}
              href={hrefForNotification(t)}
              onClick={(e) => {
                e.preventDefault();
                setToasts((q) => q.filter((x) => x.id !== t.id));
                router.push(hrefForNotification(t));
                router.refresh();
              }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-outline-variant bg-surface p-3 shadow-card transition hover:bg-surface-container-low"
              role="alert"
            >
              <span className="mt-0.5 shrink-0">
                {iconForNotification(t.type)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-on-surface">
                  {messageForNotification(t, "มีคน")}
                </p>
                <p className="mt-0.5 text-[11px] text-on-surface-variant">
                  คลิกเพื่อดู
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setToasts((q) => q.filter((x) => x.id !== t.id));
                }}
                className="shrink-0 rounded p-1 text-on-surface-variant hover:bg-surface-container"
                aria-label="ปิดการแจ้งเตือน"
              >
                <X className="h-4 w-4" />
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
