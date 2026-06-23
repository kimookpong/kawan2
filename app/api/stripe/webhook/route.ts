import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, priceToTier } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// ต้องใช้ raw body เพื่อ verify signature
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "missing signature/secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature failed: ${err.message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata?.user_id as string) || (await lookupUserByCustomer(admin, sub.customer as string));
        if (!userId) break;

        const priceId = sub.items.data[0]?.price?.id;
        const tier = priceToTier(priceId);
        const active = ["active", "trialing", "past_due"].includes(sub.status) && event.type !== "customer.subscription.deleted";

        // upsert subscription
        await admin.from("subscriptions").upsert({
          id: sub.id,
          user_id: userId,
          status: event.type === "customer.subscription.deleted" ? "canceled" : sub.status,
          tier: tier ?? "supporter",
          price_id: priceId,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        });

        // อัปเดต membership บน profile
        await admin
          .from("profiles")
          .update({
            membership_tier: active && tier ? tier : "free",
            membership_until: active ? new Date(sub.current_period_end * 1000).toISOString() : null,
          })
          .eq("id", userId);
        break;
      }

      default:
        break;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function lookupUserByCustomer(admin: ReturnType<typeof createAdminClient>, customerId: string) {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id as string | undefined;
}
