"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** เข้าสู่ระบบ/สมัครด้วย Google (ใช้ได้ทั้ง sign in และ sign up) */
export async function signInWithGoogle(formData?: FormData) {
  const supabase = createClient();
  const origin =
    headers().get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const next = String(formData?.get("redirect") || "/");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }
  if (data?.url) {
    redirect(data.url); // ไปหน้า consent ของ Google
  }
}

export async function login(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const redirectTo = String(formData.get("redirect") || "/");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signup(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const username = String(formData.get("username"));

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: username } },
  });
  if (error) {
    redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
