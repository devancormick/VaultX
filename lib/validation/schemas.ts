import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const signedUrlQuerySchema = z.object({
  asset: z.string().min(1, "Asset path required"),
});

export const uploadAssetSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  fileType: z.string().min(1),
});

export const createCheckoutSchema = z.object({
  priceId: z.string().min(1),
  plan: z.enum(["pro", "enterprise"]),
});

export const migrationUserSchema = z.object({
  memberstackId: z.string().min(1),
  email: z.string().email(),
  stripeCustomerId: z.string().min(1),
  plan: z.enum(["free", "pro", "enterprise"]),
});

export const migrationBatchSchema = z.object({
  users: z.array(migrationUserSchema).min(1).max(500),
});

export const notificationPrefsSchema = z.object({
  billing: z.boolean(),
  access: z.boolean(),
  product: z.boolean(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type MigrationBatchInput = z.infer<typeof migrationBatchSchema>;
