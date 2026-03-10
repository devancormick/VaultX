import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const FEATURE_COMPARISON = [
  { feature: "Assets", free: "5", pro: "100", enterprise: "Unlimited" },
  { feature: "Max file size", free: "25 MB", pro: "100 MB", enterprise: "500 MB" },
  { feature: "Viewer sessions", free: "1", pro: "5", enterprise: "50" },
  { feature: "Signed URL expiry", free: "60 sec", pro: "300 sec", enterprise: "3600 sec" },
  { feature: "Rate limit", free: "10/min", pro: "30/min", enterprise: "100/min" },
  { feature: "Custom domain", free: false, pro: false, enterprise: true },
  { feature: "Priority support", free: false, pro: true, enterprise: true },
  { feature: "SLA guarantee", free: false, pro: false, enterprise: true },
  { feature: "Audit log", free: true, pro: true, enterprise: true },
  { feature: "Stripe billing", free: false, pro: true, enterprise: true },
];

const FAQ = [
  {
    q: "Can I upgrade or downgrade at any time?",
    a: "Yes. You can change your plan at any time through the billing portal. Changes take effect at the next billing cycle.",
  },
  {
    q: "What happens to my assets if I cancel?",
    a: "Your assets are preserved for 30 days after cancellation. You can export or download them during this period.",
  },
  {
    q: "Is there a free trial for Pro or Enterprise?",
    a: "We offer a 14-day free trial on Pro. Enterprise trials are arranged on request — talk to sales.",
  },
  {
    q: "How are signed URLs protected?",
    a: "Signed URLs are generated server-side only after confirming an active subscription. They expire in 60–3600 seconds depending on your plan. Direct bucket access is disabled.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen noise-bg">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="font-display font-extrabold text-4xl md:text-5xl text-text mb-4">
            Transparent pricing
          </h1>
          <p className="text-muted text-lg">No surprises. Cancel anytime.</p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { name: "Free", price: 0, plan: "free", features: ["5 assets", "25MB max", "1 viewer session", "60s URL expiry"], popular: false },
            { name: "Pro", price: 49, plan: "pro", features: ["100 assets", "100MB max", "5 viewer sessions", "300s URL expiry", "30 req/min", "Priority support"], popular: true },
            { name: "Enterprise", price: 199, plan: "enterprise", features: ["Unlimited assets", "500MB max", "50 viewer sessions", "3600s URL expiry", "100 req/min", "Custom domain", "SLA"], popular: false },
          ].map((tier) => (
            <Card
              key={tier.plan}
              className={`relative p-8 flex flex-col ${tier.popular ? "border-accent shadow-glow" : ""}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-bg text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h2 className="font-display font-extrabold text-xl text-text mb-1">{tier.name}</h2>
                <div className="flex items-end gap-1">
                  <span className="font-display font-extrabold text-4xl text-text">${tier.price}</span>
                  {tier.price > 0 && <span className="text-muted mb-1">/month</span>}
                </div>
              </div>
              <ul className="space-y-2.5 flex-1 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={tier.plan === "enterprise" ? "mailto:sales@vaultx.app" : "/signup"}>
                <Button variant={tier.popular ? "primary" : "secondary"} className="w-full">
                  {tier.plan === "free" ? "Start free" : tier.plan === "enterprise" ? "Talk to sales" : "Get Pro"}
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        {/* Feature comparison table */}
        <div className="mb-20">
          <h2 className="font-display font-extrabold text-2xl text-text mb-6">Full comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 text-muted font-medium">Feature</th>
                  {["Free", "Pro", "Enterprise"].map((h) => (
                    <th key={h} className="text-center py-3 px-4 text-text font-display font-extrabold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-border/50 hover:bg-surface/50">
                    <td className="py-3 pr-4 text-muted">{row.feature}</td>
                    {[row.free, row.pro, row.enterprise].map((val, i) => (
                      <td key={i} className="py-3 px-4 text-center">
                        {typeof val === "boolean" ? (
                          val ? <Check className="w-4 h-4 text-success mx-auto" /> : <X className="w-4 h-4 text-border mx-auto" />
                        ) : (
                          <span className="text-text">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-2xl text-text mb-6">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="border border-border rounded-card p-5">
                <p className="font-medium text-text mb-2">{item.q}</p>
                <p className="text-sm text-muted leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
