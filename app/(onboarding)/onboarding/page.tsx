"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    badge: null,
    features: ["5 assets", "25MB max file size", "1 viewer session", "10 signed URLs/min"],
  },
  {
    key: "pro",
    name: "Pro",
    price: 49,
    badge: "Most Popular",
    features: ["100 assets", "100MB max file size", "5 viewer sessions", "30 signed URLs/min", "Priority support"],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 199,
    badge: null,
    features: ["Unlimited assets", "500MB max file size", "50 viewer sessions", "100 signed URLs/min", "Custom domain", "SLA"],
  },
];

export default function OnboardingPage() {
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (selectedPlan === "free") {
      window.location.href = "/dashboard";
      return;
    }

    setLoading(true);
    try {
      const priceId =
        selectedPlan === "pro"
          ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
          : process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID;

      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, plan: selectedPlan }),
      });

      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen noise-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent text-bg text-xs font-bold flex items-center justify-center">1</div>
            <span className="text-sm text-text font-medium">Choose plan</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-card border border-border text-muted text-xs font-bold flex items-center justify-center">2</div>
            <span className="text-sm text-muted">Activate</span>
          </div>
        </div>

        <h1 className="font-display font-extrabold text-3xl text-text text-center mb-2">Choose your plan</h1>
        <p className="text-muted text-center mb-10">You can change your plan at any time.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {PLANS.map((plan) => (
            <button
              key={plan.key}
              onClick={() => setSelectedPlan(plan.key)}
              className={`relative text-left rounded-card border p-6 transition-all duration-200 ${
                selectedPlan === plan.key
                  ? "border-accent shadow-glow bg-card"
                  : "border-border bg-card/50 hover:border-border hover:bg-card"
              }`}
            >
              {plan.badge && (
                <Badge variant="pro" className="absolute -top-2 left-4">{plan.badge}</Badge>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-display font-extrabold text-lg text-text">{plan.name}</p>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="font-display font-extrabold text-2xl text-text">${plan.price}</span>
                    {plan.price > 0 && <span className="text-muted text-sm mb-0.5">/mo</span>}
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                  selectedPlan === plan.key ? "border-accent bg-accent" : "border-border"
                }`}>
                  {selectedPlan === plan.key && <Check className="w-3 h-3 text-bg" />}
                </div>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted">
                    <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <Button size="lg" onClick={handleContinue} loading={loading} className="min-w-[200px]">
            {selectedPlan === "free" ? "Start for free" : `Subscribe to ${PLANS.find(p => p.key === selectedPlan)?.name}`}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
