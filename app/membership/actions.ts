"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getStripe, TIER_PRICE } from "@/lib/stripe";

/** สร้าง Stripe Checkout Session แบบ subscription แล้ว redirect ไปหน้าจ่ายเงิน */
export async function subscribe(formData: FormData) {
  const tier = String(formData.get("tier")) as "supporter" | "patron";
  const priceId = TIER_PRICE[tier];

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/membership");

  if (!priceId) {
    redirect("/membership?error=" + encodeURIComponent("ยังไม่ได้ตั้งค่า Price ID ของแพ็กเกจนี้"));
  }

  const origin = headers().get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  // หา/สร้าง Stripe customer ผูกกับ user
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, username")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id, username: profile?.username ?? "" },
    });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { user_id: user.id, tier },
    subscription_data: { metadata: { user_id: user.id, tier } },
    success_url: `${origin}/membership?success=1`,
    cancel_url: `${origin}/membership?canceled=1`,
    allow_promotion_codes: true,
  });

  if (session.url) redirect(session.url);
  redirect("/membership?error=" + encodeURIComponent("สร้างหน้าชำระเงินไม่สำเร็จ"));
}

/** เปิด Stripe Customer Portal เพื่อจัดการ/ยกเลิก subscription */
export async function openBillingPortal() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/membership");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) redirect("/membership");

  const origin = headers().get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const portal = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/membership`,
  });
  redirect(portal.url);
}
