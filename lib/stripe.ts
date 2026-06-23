import Stripe from "stripe";

/** สร้าง Stripe client แบบ lazy — จะ throw เฉพาะตอนเรียกใช้จริงถ้ายังไม่ตั้งคีย์ */
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("ยังไม่ได้ตั้งค่า STRIPE_SECRET_KEY ใน .env.local");
  }
  _stripe = new Stripe(key, { typescript: true });
  return _stripe;
}

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
