import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/events/event-form";
import { updateEvent } from "../../actions";

export const metadata = {
  title: "แก้ไขกิจกรรม",
  robots: { index: false, follow: false },
};

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/events/${params.id}/edit`);

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin" && me?.role !== "editor") redirect("/events");

  const { data: event } = await supabase
    .from("events")
    .select("id, title, description, location, cover_url, province_id, starts_at, ends_at")
    .eq("id", Number(params.id))
    .single();
  if (!event) notFound();

  return (
    <div className="w-full space-y-4">
      <nav className="text-xs text-on-surface-variant">
        <Link href="/events" className="hover:text-primary">ปฏิทินกิจกรรม</Link> › แก้ไขกิจกรรม
      </nav>
      <h1 className="text-xl font-bold text-primary sm:text-2xl">แก้ไขกิจกรรม</h1>

      {searchParams.error && (
        <p className="flex items-center gap-2 rounded border border-error-container bg-error-container px-3 py-2 text-sm text-on-error-container">
          <AlertCircle className="h-4 w-4" /> {searchParams.error}
        </p>
      )}

      <EventForm action={updateEvent} event={event} submitLabel="บันทึกการแก้ไข" />
    </div>
  );
}
