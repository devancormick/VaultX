import Link from "next/link";
import { Suspense } from "react";
import { Shield, Zap, CreditCard, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PLANS } from "@/lib/stripe/client";
import { HeroBackground } from "./hero-background";

const FEATURES = [
  {
    icon: Shield,
    title: "Backend Auth",
    description:
      "Every protected route goes through server-side middleware. Zero client-side trust. Supabase RLS on every table.",
  },
  {
    icon: Zap,
    title: "Protected Assets",
    description:
      "Private storage buckets only. Every asset request generates a signed URL with a 300-second expiry after subscription check.",
  },
  {
    icon: CreditCard,
    title: "Stripe Billing",
    description:
      "Real subscriptions, webhook signature verification, Stripe Customer Portal. No fake billing — real Stripe checkout.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen noise-bg">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <Suspense fallback={null}>
          <HeroBackground />
        </Suspense>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Production-grade SaaS platform
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-text leading-tight">
            Secure access.
            <br />
            <span className="text-accent">Protected assets.</span>
            <br />
            Zero compromise.
          </h1>

          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            VaultX is the platform layer for gated browser-based 3D experiences.
            Enterprise auth, asset protection, and Stripe billing — without rebuilding
            it from scratch.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                See Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-text mb-4">
            Your 3D tool is powerful.
            <br />
            <span className="text-danger">Your current security is not.</span>
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Studios and agencies spending weeks rebuilding auth, billing, and asset protection
            for every project. VaultX eliminates that entirely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.title} className="text-center p-8 hover:shadow-glow transition-all duration-300">
              <div className="inline-flex p-3 rounded-xl bg-accent/10 mb-5">
                <f.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-text mb-3">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-text mb-3">
            Security architecture
          </h2>
          <p className="text-muted">Every request flows through multiple security layers.</p>
        </div>
        <ArchitectureDiagram />
      </section>

      {/* Pricing Preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-text mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted text-lg">Start free. Scale when you need to.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => (
            <PricingCard key={key} planKey={key} plan={plan} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function PricingCard({ planKey, plan }: { planKey: string; plan: (typeof PLANS)[keyof typeof PLANS] }) {
  const isPro = planKey === "pro";
  return (
    <Card
      className={`relative p-8 flex flex-col ${isPro ? "border-accent shadow-glow" : ""}`}
    >
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-bg text-xs font-bold rounded-full">
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="font-display font-extrabold text-xl text-text mb-2">{plan.name}</h3>
        <div className="flex items-end gap-1">
          <span className="font-display font-extrabold text-4xl text-text">${plan.price}</span>
          {plan.price > 0 && <span className="text-muted mb-1">/mo</span>}
        </div>
      </div>
      <ul className="space-y-3 flex-1 mb-8">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-muted">
            <Check className="w-4 h-4 text-success flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link href={planKey === "free" ? "/signup" : "/signup"}>
        <Button variant={isPro ? "primary" : "secondary"} className="w-full">
          {planKey === "free" ? "Get started free" : `Get ${plan.name}`}
        </Button>
      </Link>
    </Card>
  );
}

function ArchitectureDiagram() {
  const steps = [
    { label: "Request", color: "#F8FAFC" },
    { label: "Middleware", color: "#00D4FF" },
    { label: "Subscription Check", color: "#7C3AED" },
    { label: "Signed URL", color: "#10B981" },
    { label: "Asset", color: "#F59E0B" },
  ];
  return (
    <div className="bg-card border border-border rounded-card p-8 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[500px]">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold border"
                style={{ borderColor: step.color, color: step.color, backgroundColor: `${step.color}15` }}
              >
                {i + 1}
              </div>
              <span className="text-xs text-muted text-center max-w-[70px]">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-10 h-px mx-2 mt-[-14px]" style={{ backgroundColor: step.color, opacity: 0.4 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
