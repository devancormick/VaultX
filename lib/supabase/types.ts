export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "unpaid";

export type Plan = "free" | "pro" | "enterprise";

export type AuditEventType =
  | "viewer.load"
  | "asset.signed_url"
  | "auth.login"
  | "auth.logout"
  | "subscription.changed"
  | "migration.batch";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  memberstack_id: string | null;
  is_admin: boolean;
  email_verified: boolean;
  notification_prefs: {
    billing: boolean;
    access: boolean;
    product: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  plan: Plan;
  stripe_price_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  thumbnail_url: string | null;
  access_count: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  event_type: AuditEventType;
  event_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  status: "success" | "blocked" | "error" | null;
  created_at: string;
}

export interface ViewerSession {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  revoked: boolean;
  created_at: string;
}

export interface PlanLimits {
  plan: Plan;
  max_assets: number;
  max_asset_size_mb: number;
  signed_url_expiry: number;
  rate_limit_per_min: number;
  viewer_sessions: number;
}

export interface MigrationBatch {
  id: string;
  initiated_by: string | null;
  total_users: number | null;
  succeeded: number;
  failed: number;
  status: "pending" | "running" | "complete" | "failed" | "rolled_back";
  error_log: unknown;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}
