import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

// Named export alias for convenience
export const stripe = {
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
} as unknown as Stripe;

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: null,
    features: [
      "5 assets",
      "25MB max file size",
      "1 viewer session",
      "10 signed URLs/min",
    ],
  },
  pro: {
    name: "Pro",
    price: 49,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    features: [
      "100 assets",
      "100MB max file size",
      "5 viewer sessions",
      "30 signed URLs/min",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 199,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      "Unlimited assets",
      "500MB max file size",
      "50 viewer sessions",
      "100 signed URLs/min",
      "Dedicated support",
      "Custom domain",
      "SLA guarantee",
    ],
  },
} as const;
