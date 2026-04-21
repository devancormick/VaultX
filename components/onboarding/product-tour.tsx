"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronRight, ChevronLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TOUR_KEY = "vaultx_tour_v1";

interface Step {
  icon: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
}

const COACH_STEPS: Step[] = [
  {
    icon: "🏈",
    title: "Welcome to VaultX Football",
    body: "This is your command center for building and teaching football plays. Let's take a quick tour so you know where everything is.",
  },
  {
    icon: "👥",
    title: "Create Your Team",
    body: "Go to Playbook → Teams to create your first team. Give it a name (e.g. Varsity Offense) and you'll get an invite code to share with players.",
    cta: { label: "Go to Teams", href: "/playbook/teams" },
  },
  {
    icon: "📚",
    title: "Build Your Playbook",
    body: "Inside each team you can create Playbooks — collections of plays. Think of a playbook as a folder for a specific game situation (Red Zone, 2-minute drill, etc.).",
    cta: { label: "Go to Playbook", href: "/playbook" },
  },
  {
    icon: "✏️",
    title: "Design Plays on the Canvas",
    body: "Open a play to enter the workspace. Use the Draw tool to sketch routes, place player tokens, add text labels, and record each player's path with drag-to-record.",
  },
  {
    icon: "📧",
    title: "Invite Players",
    body: "Once your team is set up, invite players by email. They'll get a link to create an account and join your team — then they can start drilling your plays immediately.",
    cta: { label: "Invite Players", href: "/playbook/teams" },
  },
  {
    icon: "📊",
    title: "Track Player Progress",
    body: "Visit the Learn page to see your team leaderboard — XP earned, streaks, and drill completion rates. The spaced-repetition engine automatically re-queues plays players need to review.",
    cta: { label: "View Leaderboard", href: "/learn" },
  },
];

const PLAYER_STEPS: Step[] = [
  {
    icon: "🏈",
    title: "Welcome to VaultX Football",
    body: "Your coach has added you to a team. Here you'll master every play in your playbook through a 4-phase learning system — just like how pros study film.",
  },
  {
    icon: "📖",
    title: "Study Phase",
    body: "Watch your play animate in 3D. See every route, every assignment. Take as long as you need — you control when to advance.",
  },
  {
    icon: "🎯",
    title: "Identify Phase",
    body: "Labels are hidden. Drag the position tags onto the correct players. This locks in your recognition of formations and assignments.",
  },
  {
    icon: "✍️",
    title: "Execute Phase",
    body: "Draw your own route on the field. Your drawing is scored against the coach's recorded path using Fréchet distance — the closer, the higher your score.",
  },
  {
    icon: "⚡",
    title: "Game Ready Phase",
    body: "Answer a pre-snap read scenario against the clock. Speed + accuracy = your final score. High scores push your next review further out.",
  },
  {
    icon: "🔥",
    title: "Earn XP and Climb the Board",
    body: "Every drill earns XP. Maintain daily streaks for bonus XP. Unlock achievements and see where you rank on your team leaderboard.",
    cta: { label: "Start Drilling", href: "/learn" },
  },
];

interface ProductTourProps {
  isCoach?: boolean;
}

export function ProductTour({ isCoach = false }: ProductTourProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const router = useRouter();
  const steps = isCoach ? COACH_STEPS : PLAYER_STEPS;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      // Small delay so page renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(TOUR_KEY, "1");
    setVisible(false);
  }

  function next() {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  }

  function prev() {
    setStep(s => Math.max(0, s - 1));
  }

  function handleCta(href: string) {
    dismiss();
    router.push(href);
  }

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-bg/60 backdrop-blur-sm z-50"
        onClick={dismiss}
        aria-hidden
      />

      {/* Tour card */}
      <div className="fixed bottom-6 right-6 z-50 w-[340px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Progress bar */}
        <div className="h-1 bg-border">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Zap className="w-3 h-3 text-accent" />
            <span>Quick tour</span>
            <span className="text-muted/50">·</span>
            <span>{step + 1} / {steps.length}</span>
          </div>
          <button
            onClick={dismiss}
            className="text-muted hover:text-text transition-colors p-1 -mr-1 rounded"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <div className="text-3xl mb-2">{current.icon}</div>
          <h3 className="font-display font-extrabold text-base text-text mb-1.5">{current.title}</h3>
          <p className="text-sm text-muted leading-relaxed">{current.body}</p>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex items-center justify-between gap-2 mt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={prev}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {current.cta && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCta(current.cta!.href)}
              >
                {current.cta.label}
              </Button>
            )}
            <Button size="sm" onClick={next} className="gap-1">
              {isLast ? "Done" : "Next"}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === step ? "bg-accent w-4" : "bg-border hover:bg-muted",
              )}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// Re-open button shown after tour is dismissed
export function TourButton() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(!!localStorage.getItem(TOUR_KEY));
  }, []);

  if (!dismissed) return null;

  function reopen() {
    localStorage.removeItem(TOUR_KEY);
    window.location.reload();
  }

  return (
    <button
      onClick={reopen}
      className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent hover:bg-accent/30 transition-colors shadow-lg"
      title="Restart tour"
    >
      <Zap className="w-4 h-4" />
    </button>
  );
}
