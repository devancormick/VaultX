import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "active" | "past_due" | "canceled" | "free" | "pro" | "enterprise" | "trialing" | "default";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  active: "bg-success/10 text-success border-success/20",
  past_due: "bg-warning/10 text-warning border-warning/20",
  canceled: "bg-danger/10 text-danger border-danger/20",
  free: "bg-border/50 text-muted border-border",
  pro: "bg-violet/10 text-violet border-violet/20",
  enterprise: "bg-accent/10 text-accent border-accent/20",
  trialing: "bg-warning/10 text-warning border-warning/20",
  default: "bg-card text-muted border-border",
};

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
