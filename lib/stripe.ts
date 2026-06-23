import Stripe from "stripe";

/** Stripe server client — ใช้ฝั่ง server เท่านั้น */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

/** map tier → Stripe Price ID (ตั้งใน .env.local) */
export const TIER_PRICE: Record<"supporter" | "patron", string | undefined> = {
  supporter: process.env.STRIPE_PRICE_SUPPORTER,
  patron: process.env.STRIPE_PRICE_PATRON,
};

/** map Stripe Price ID → tier (ใช้ใน webhook) */
export function priceToTier(priceId: string | null | undefined): "supporter" | "patron" | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_SUPPORTER) return "supporter";
  if (priceId === process.env.STRIPE_PRICE_PATRON) return "patron";
  return null;
}
