import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  UPSTASH_REDIS_REST_URL: z.string().optional().default("https://placeholder.upstash.io"),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  SENTRY_DSN: z.string().optional().default(""),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: z.string().optional().default(""),
  NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID: z.string().optional().default(""),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
});

function validateEnv() {
  const isServer = typeof window === "undefined";

  const publicResult = publicEnvSchema.safeParse(process.env);
  if (!publicResult.success) {
    const missing = publicResult.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing required public env vars: ${missing}`);
  }

  if (isServer) {
    const serverResult = serverEnvSchema.safeParse(process.env);
    if (!serverResult.success) {
      const missing = serverResult.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Missing required server env vars: ${missing}`);
    }
    return { ...publicResult.data, ...serverResult.data };
  }

  return publicResult.data;
}

export const env = validateEnv();
