import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "@/components/layout/app-shell";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kawan2.vercel.app"),
  title: {
    default: "Kawan2 | ชุมชนชายแดนใต้",
    template: "%s | Kawan2",
  },
  description:
    "ศูนย์กลางข่าวสาร กระดานสนทนา และชุมชนของ 3 จังหวัดชายแดนใต้ — ปัตตานี นราธิวาส ยะลา",
  applicationName: "Kawan2",
  openGraph: {
    type: "website",
    siteName: "Kawan2",
    locale: "th_TH",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/image.png",
    shortcut: "/image.png",
    apple: "/image.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, level_id, reputation, role, banned_until, disabled")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;900&family=Sarabun:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <AppShell user={user} profile={profile}>
          <div className="min-h-[70vh] px-4 py-6 md:px-6">{children}</div>
          <Footer />
        </AppShell>
        <Analytics />
      </body>
    </html>
  );
}
